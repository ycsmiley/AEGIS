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
    
    // Track used invoices and LP deposits
    mapping(bytes32 => bool) public usedInvoices;
    mapping(address => uint256) public lpDeposits;
    mapping(bytes32 => FinancingRecord) public financingRecords;
    
    // ============ Structs ============
    struct FinancingRecord {
        bytes32 invoiceId;
        address supplier;
        uint256 payoutAmount;
        uint256 timestamp;
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
        uint256 amount
    );
    event AegisWalletUpdated(address indexed oldWallet, address indexed newWallet);
    
    // ============ Constructor ============
    constructor(address _aegisServerWallet) 
        EIP712("ArcPool", "1") 
        payable 
    {
        require(_aegisServerWallet != address(0), "Invalid Aegis wallet");
        aegisServerWallet = _aegisServerWallet;
        
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
        require(msg.value > 0, "Amount must be greater than 0");
        
        lpDeposits[msg.sender] += msg.value;
        totalPoolSize += msg.value;
        availableLiquidity += msg.value;
        
        emit Deposit(msg.sender, msg.value, totalPoolSize);
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
     * @param nonce Unique nonce for replay protection
     * @param deadline Signature expiration timestamp
     * @param signature EIP-712 signature from Aegis server
     */
    function withdrawFinancing(
        bytes32 invoiceId,
        uint256 payoutAmount,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) external nonReentrant {
        require(!usedInvoices[invoiceId], "Invoice already financed");
        require(block.timestamp <= deadline, "Signature expired");
        require(payoutAmount <= availableLiquidity, "Insufficient pool liquidity");
        
        // Build EIP-712 hash
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("FinancingRequest(bytes32 invoiceId,address supplier,uint256 payoutAmount,uint256 nonce,uint256 deadline)"),
                invoiceId,
                msg.sender,
                payoutAmount,
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
            timestamp: block.timestamp,
            repaid: false
        });
        
        // Transfer USDC to supplier
        (bool success, ) = msg.sender.call{value: payoutAmount}("");
        require(success, "USDC transfer failed");
        
        emit FinancingWithdrawn(invoiceId, msg.sender, payoutAmount, block.timestamp);
    }
    
    /**
     * @notice Repay financed invoice
     * @param invoiceId Invoice to repay
     */
    function repay(bytes32 invoiceId) external payable nonReentrant {
        require(usedInvoices[invoiceId], "Invoice not financed");
        require(!financingRecords[invoiceId].repaid, "Already repaid");
        require(msg.value > 0, "Invalid repayment amount");
        
        financingRecords[invoiceId].repaid = true;
        availableLiquidity += msg.value;
        
        emit Repayment(invoiceId, msg.sender, msg.value);
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
     * @notice Receive function for anonymous USDC deposits
     */
    receive() external payable {
        totalPoolSize += msg.value;
        availableLiquidity += msg.value;
        emit Deposit(msg.sender, msg.value, totalPoolSize);
    }
}

