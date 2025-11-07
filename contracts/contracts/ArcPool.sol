// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title ArcPool - Arc Chain Native Supply Chain Finance Pool
 * @notice On Arc, gas is paid in USDC, simplifying the entire flow
 * @dev Uses native USDC transfers (msg.value) instead of ERC20
 */
contract ArcPool is ReentrancyGuard, AccessControl, EIP712 {
    using ECDSA for bytes32;
    
    // ============ Role Definitions ============
    bytes32 public constant AEGIS_ROLE = keccak256("AEGIS_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============ State Variables ============
    address public aegisServerWallet;
    uint256 public totalPoolSize;
    uint256 public availableLiquidity;
    uint256 public totalFinanced;
    uint256 public totalInterestEarned;    // Track total interest earned
    uint256 public protocolFeeRate = 1000; // 10% of interest (basis points, 10000 = 100%)
    address public protocolFeeReceiver;    // Address to receive protocol fees
    
    // Track used invoices and LP deposits
    mapping(bytes32 => bool) public usedInvoices;
    mapping(address => uint256) public lpDeposits;
    mapping(bytes32 => FinancingRecord) public financingRecords;
    
    // ============ Structs ============
    struct FinancingRecord {
        bytes32 invoiceId;
        address supplier;
        uint256 payoutAmount;      // Amount paid to supplier
        uint256 repaymentAmount;   // Amount that must be repaid (includes interest)
        uint256 dueDate;           // Repayment due date
        uint256 timestamp;         // Financing timestamp
        bool repaid;
    }
    
    // ============ Events ============
    event Deposit(address indexed lp, uint256 amount, uint256 newTotalPoolSize);
    event Withdrawal(address indexed lp, uint256 amount, uint256 newTotalPoolSize);
    event FinancingWithdrawn(
        bytes32 indexed invoiceId,
        address indexed supplier,
        uint256 amount,
        uint256 timestamp
    );
    event Repayment(
        bytes32 indexed invoiceId,
        address indexed payer,
        uint256 amount,
        uint256 interest,
        uint256 lateFee
    );
    event InterestDistributed(uint256 lpShare, uint256 protocolShare);
    event AegisWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    // ============ Constructor ============
    constructor(address _aegisServerWallet) 
        EIP712("ArcPool", "1") 
        payable 
    {
        require(_aegisServerWallet != address(0), "Invalid Aegis wallet");
        aegisServerWallet = _aegisServerWallet;
        protocolFeeReceiver = msg.sender; // Default to deployer
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(AEGIS_ROLE, _aegisServerWallet);
        
        // If deployed with initial liquidity
        if (msg.value > 0) {
            totalPoolSize = msg.value;
            availableLiquidity = msg.value;
            lpDeposits[msg.sender] = msg.value;
            emit Deposit(msg.sender, msg.value, totalPoolSize);
        }
    }
    
    // ============ LP Functions ============
    
    /**
     * @notice LP deposits USDC (native token on Arc)
     */
    function deposit() external payable nonReentrant {
        _processDeposit(msg.sender, msg.value);
    }
    
    /**
     * @notice LP withdraws USDC
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= lpDeposits[msg.sender], "Insufficient deposit");
        require(amount <= availableLiquidity, "Insufficient pool liquidity");
        
        lpDeposits[msg.sender] -= amount;
        totalPoolSize -= amount;
        availableLiquidity -= amount;
        
        // Arc native USDC transfer
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount, totalPoolSize);
    }
    
    // ============ Financing Functions ============
    
    /**
     * @notice Supplier withdraws financing with Aegis signature
     * @dev Core function: validates EIP-712 signature and transfers USDC
     * @param invoiceId Unique invoice identifier
     * @param payoutAmount Amount to payout to supplier
     * @param repaymentAmount Total amount that must be repaid (includes interest)
     * @param dueDate Repayment due date timestamp
     * @param nonce Unique nonce for replay protection
     * @param deadline Signature expiration timestamp
     * @param signature EIP-712 signature from Aegis server
     */
    function withdrawFinancing(
        bytes32 invoiceId,
        uint256 payoutAmount,
        uint256 repaymentAmount,
        uint256 dueDate,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) external nonReentrant {
        require(!usedInvoices[invoiceId], "Invoice already financed");
        require(block.timestamp <= deadline, "Signature expired");
        require(payoutAmount <= availableLiquidity, "Insufficient pool liquidity");
        require(repaymentAmount > payoutAmount, "Repayment must be greater than payout");
        require(dueDate > block.timestamp, "Due date must be in the future");
        
        // Build EIP-712 hash (updated to include repaymentAmount and dueDate)
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("FinancingRequest(bytes32 invoiceId,address supplier,uint256 payoutAmount,uint256 repaymentAmount,uint256 dueDate,uint256 nonce,uint256 deadline)"),
                invoiceId,
                msg.sender,
                payoutAmount,
                repaymentAmount,
                dueDate,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        require(signer == aegisServerWallet, "Invalid signature");
        
        // Mark invoice as used
        usedInvoices[invoiceId] = true;
        availableLiquidity -= payoutAmount;
        totalFinanced += payoutAmount;
        
        // Store financing record
        financingRecords[invoiceId] = FinancingRecord({
            invoiceId: invoiceId,
            supplier: msg.sender,
            payoutAmount: payoutAmount,
            repaymentAmount: repaymentAmount,
            dueDate: dueDate,
            timestamp: block.timestamp,
            repaid: false
        });
        
        // Transfer USDC to supplier
        (bool success, ) = msg.sender.call{value: payoutAmount}("");
        require(success, "USDC transfer failed");
        
        emit FinancingWithdrawn(invoiceId, msg.sender, payoutAmount, block.timestamp);
    }
    
    /**
     * @notice Repay financed invoice with interest
     * @param invoiceId Invoice to repay
     */
    function repay(bytes32 invoiceId) external payable nonReentrant {
        FinancingRecord storage record = financingRecords[invoiceId];
        
        require(usedInvoices[invoiceId], "Invoice not financed");
        require(!record.repaid, "Already repaid");
        
        uint256 requiredAmount = record.repaymentAmount;
        uint256 lateFee = 0;
        
        // Calculate late fee if overdue (1% per day, capped at 30%)
        if (block.timestamp > record.dueDate) {
            uint256 daysLate = (block.timestamp - record.dueDate) / 1 days;
            lateFee = (record.repaymentAmount * daysLate * 100) / 10000; // 1% per day
            uint256 maxLateFee = (record.repaymentAmount * 3000) / 10000; // Cap at 30%
            if (lateFee > maxLateFee) lateFee = maxLateFee;
            requiredAmount += lateFee;
        }
        
        require(msg.value >= requiredAmount, "Insufficient repayment amount");
        
        // Calculate interest (difference between repayment and payout)
        uint256 baseInterest = record.repaymentAmount - record.payoutAmount;
        uint256 totalInterest = baseInterest + lateFee;
        
        // Distribute interest: 90% to LPs, 10% to protocol
        uint256 protocolFee = (totalInterest * protocolFeeRate) / 10000;
        uint256 lpInterest = totalInterest - protocolFee;
        
        // Mark as repaid
        record.repaid = true;
        
        // Update liquidity (principal + LP share of interest)
        availableLiquidity += record.payoutAmount + lpInterest;
        totalPoolSize += lpInterest;
        totalInterestEarned += totalInterest;
        
        // Transfer protocol fee
        if (protocolFee > 0) {
            (bool success, ) = protocolFeeReceiver.call{value: protocolFee}("");
            require(success, "Protocol fee transfer failed");
        }
        
        // Refund excess payment
        if (msg.value > requiredAmount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - requiredAmount}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit Repayment(invoiceId, msg.sender, msg.value, totalInterest, lateFee);
        emit InterestDistributed(lpInterest, protocolFee);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update Aegis server wallet address
     * @param newWallet New Aegis wallet address
     */
    function updateAegisWallet(address newWallet) external onlyRole(ADMIN_ROLE) {
        require(newWallet != address(0), "Invalid wallet address");
        address oldWallet = aegisServerWallet;
        aegisServerWallet = newWallet;
        
        revokeRole(AEGIS_ROLE, oldWallet);
        grantRole(AEGIS_ROLE, newWallet);
        
        emit AegisWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @notice Update protocol fee rate
     * @param newRate New fee rate in basis points (10000 = 100%)
     */
    function updateProtocolFeeRate(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        require(newRate <= 5000, "Fee rate cannot exceed 50%");
        protocolFeeRate = newRate;
    }
    
    /**
     * @notice Update protocol fee receiver
     * @param newReceiver New fee receiver address
     */
    function updateProtocolFeeReceiver(address newReceiver) external onlyRole(ADMIN_ROLE) {
        require(newReceiver != address(0), "Invalid receiver address");
        protocolFeeReceiver = newReceiver;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get pool status
     * @return total Total pool size
     * @return available Available liquidity
     * @return utilized Utilized amount
     * @return financed Total financed amount
     */
    function getPoolStatus() external view returns (
        uint256 total,
        uint256 available,
        uint256 utilized,
        uint256 financed
    ) {
        return (
            totalPoolSize,
            availableLiquidity,
            totalPoolSize - availableLiquidity,
            totalFinanced
        );
    }
    
    /**
     * @notice Get LP's deposit balance
     * @param lp LP address
     * @return Deposit balance
     */
    function getLPBalance(address lp) external view returns (uint256) {
        return lpDeposits[lp];
    }
    
    /**
     * @notice Check if invoice is already financed
     * @param invoiceId Invoice ID
     * @return Whether invoice is used
     */
    function isInvoiceFinanced(bytes32 invoiceId) external view returns (bool) {
        return usedInvoices[invoiceId];
    }
    
    /**
     * @notice Get financing record details
     * @param invoiceId Invoice ID
     * @return Financing record
     */
    function getFinancingRecord(bytes32 invoiceId) external view returns (FinancingRecord memory) {
        return financingRecords[invoiceId];
    }
    
    // ============ Fallback Functions ============
    
    /**
     * @notice Receive function redirects to deposit()
     * @dev Any direct transfers are treated as LP deposits
     */
    receive() external payable {
        // Redirect to deposit() to ensure proper accounting
        _processDeposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Internal function to process deposits
     */
    function _processDeposit(address depositor, uint256 amount) private {
        require(amount > 0, "Amount must be greater than 0");
        
        lpDeposits[depositor] += amount;
        totalPoolSize += amount;
        availableLiquidity += amount;
        
        emit Deposit(depositor, amount, totalPoolSize);
    }
}

