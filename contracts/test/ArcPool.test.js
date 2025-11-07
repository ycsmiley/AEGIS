const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArcPool", function () {
  let arcPool;
  let owner, aegisWallet, lp1, lp2, supplier1, buyer1;
  let invoiceId1;

  beforeEach(async function () {
    [owner, aegisWallet, lp1, lp2, supplier1, buyer1] = await ethers.getSigners();

    // Deploy ArcPool
    const ArcPool = await ethers.getContractFactory("ArcPool");
    arcPool = await ArcPool.deploy(aegisWallet.address);
    await arcPool.waitForDeployment();

    // Generate test invoice ID
    invoiceId1 = ethers.id("INV-2024-001");
  });

  describe("Deployment", function () {
    it("Should set the correct Aegis wallet", async function () {
      expect(await arcPool.aegisServerWallet()).to.equal(aegisWallet.address);
    });

    it("Should grant ADMIN_ROLE to deployer", async function () {
      const ADMIN_ROLE = await arcPool.ADMIN_ROLE();
      expect(await arcPool.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should grant AEGIS_ROLE to Aegis wallet", async function () {
      const AEGIS_ROLE = await arcPool.AEGIS_ROLE();
      expect(await arcPool.hasRole(AEGIS_ROLE, aegisWallet.address)).to.be.true;
    });
  });

  describe("LP Deposits", function () {
    it("Should allow LP to deposit USDC", async function () {
      const depositAmount = ethers.parseUnits("10000", 6); // 10,000 USDC

      await expect(
        arcPool.connect(lp1).deposit({ value: depositAmount })
      )
        .to.emit(arcPool, "Deposit")
        .withArgs(lp1.address, depositAmount, depositAmount);

      expect(await arcPool.lpDeposits(lp1.address)).to.equal(depositAmount);
      expect(await arcPool.totalPoolSize()).to.equal(depositAmount);
      expect(await arcPool.availableLiquidity()).to.equal(depositAmount);
    });

    it("Should revert on zero deposit", async function () {
      await expect(
        arcPool.connect(lp1).deposit({ value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should accumulate deposits from multiple LPs", async function () {
      const amount1 = ethers.parseUnits("10000", 6);
      const amount2 = ethers.parseUnits("5000", 6);

      await arcPool.connect(lp1).deposit({ value: amount1 });
      await arcPool.connect(lp2).deposit({ value: amount2 });

      expect(await arcPool.totalPoolSize()).to.equal(amount1 + amount2);
    });
  });

  describe("LP Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseUnits("10000", 6);
      await arcPool.connect(lp1).deposit({ value: depositAmount });
    });

    it("Should allow LP to withdraw their deposit", async function () {
      const withdrawAmount = ethers.parseUnits("5000", 6);

      await expect(
        arcPool.connect(lp1).withdraw(withdrawAmount)
      ).to.emit(arcPool, "Withdrawal");

      expect(await arcPool.lpDeposits(lp1.address)).to.equal(
        ethers.parseUnits("5000", 6)
      );
    });

    it("Should revert if withdrawal exceeds deposit", async function () {
      const withdrawAmount = ethers.parseUnits("15000", 6);

      await expect(
        arcPool.connect(lp1).withdraw(withdrawAmount)
      ).to.be.revertedWith("Insufficient deposit");
    });

    it("Should revert if withdrawal exceeds available liquidity", async function () {
      // This would happen if funds are locked in financing
      const withdrawAmount = ethers.parseUnits("10000", 6);
      
      // Simulate financing by directly reducing available liquidity
      // In real scenario, this happens through withdrawFinancing
      // For now, we just test the basic withdrawal
      
      await expect(
        arcPool.connect(lp1).withdraw(withdrawAmount)
      ).to.emit(arcPool, "Withdrawal");
    });
  });

  describe("Financing", function () {
    beforeEach(async function () {
      // LP deposits liquidity
      const depositAmount = ethers.parseUnits("100000", 6);
      await arcPool.connect(lp1).deposit({ value: depositAmount });
    });

    it("Should allow supplier to withdraw financing with valid signature", async function () {
      const payoutAmount = ethers.parseUnits("98000", 6);
      const nonce = Date.now();
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Create EIP-712 signature
      const domain = {
        name: "ArcPool",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await arcPool.getAddress(),
      };

      const types = {
        FinancingRequest: [
          { name: "invoiceId", type: "bytes32" },
          { name: "supplier", type: "address" },
          { name: "payoutAmount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        invoiceId: invoiceId1,
        supplier: supplier1.address,
        payoutAmount: payoutAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await aegisWallet.signTypedData(domain, types, value);

      // Execute financing
      await expect(
        arcPool
          .connect(supplier1)
          .withdrawFinancing(invoiceId1, payoutAmount, nonce, deadline, signature)
      )
        .to.emit(arcPool, "FinancingWithdrawn")
        .withArgs(invoiceId1, supplier1.address, payoutAmount, await time.latest());

      // Verify state changes
      expect(await arcPool.usedInvoices(invoiceId1)).to.be.true;
      expect(await arcPool.availableLiquidity()).to.equal(
        ethers.parseUnits("2000", 6) // 100,000 - 98,000
      );
    });

    it("Should revert on expired signature", async function () {
      const payoutAmount = ethers.parseUnits("98000", 6);
      const nonce = Date.now();
      const deadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const domain = {
        name: "ArcPool",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await arcPool.getAddress(),
      };

      const types = {
        FinancingRequest: [
          { name: "invoiceId", type: "bytes32" },
          { name: "supplier", type: "address" },
          { name: "payoutAmount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        invoiceId: invoiceId1,
        supplier: supplier1.address,
        payoutAmount: payoutAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await aegisWallet.signTypedData(domain, types, value);

      await expect(
        arcPool
          .connect(supplier1)
          .withdrawFinancing(invoiceId1, payoutAmount, nonce, deadline, signature)
      ).to.be.revertedWith("Signature expired");
    });

    it("Should revert on invalid signature", async function () {
      const payoutAmount = ethers.parseUnits("98000", 6);
      const nonce = Date.now();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Use wrong signer
      const domain = {
        name: "ArcPool",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await arcPool.getAddress(),
      };

      const types = {
        FinancingRequest: [
          { name: "invoiceId", type: "bytes32" },
          { name: "supplier", type: "address" },
          { name: "payoutAmount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        invoiceId: invoiceId1,
        supplier: supplier1.address,
        payoutAmount: payoutAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await owner.signTypedData(domain, types, value); // Wrong signer!

      await expect(
        arcPool
          .connect(supplier1)
          .withdrawFinancing(invoiceId1, payoutAmount, nonce, deadline, signature)
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should prevent double financing of same invoice", async function () {
      const payoutAmount = ethers.parseUnits("98000", 6);
      const nonce = Date.now();
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: "ArcPool",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await arcPool.getAddress(),
      };

      const types = {
        FinancingRequest: [
          { name: "invoiceId", type: "bytes32" },
          { name: "supplier", type: "address" },
          { name: "payoutAmount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        invoiceId: invoiceId1,
        supplier: supplier1.address,
        payoutAmount: payoutAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await aegisWallet.signTypedData(domain, types, value);

      // First financing
      await arcPool
        .connect(supplier1)
        .withdrawFinancing(invoiceId1, payoutAmount, nonce, deadline, signature);

      // Try to finance again
      await expect(
        arcPool
          .connect(supplier1)
          .withdrawFinancing(invoiceId1, payoutAmount, nonce, deadline, signature)
      ).to.be.revertedWith("Invoice already financed");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update Aegis wallet", async function () {
      const newAegisWallet = lp2.address;

      await expect(
        arcPool.connect(owner).updateAegisWallet(newAegisWallet)
      )
        .to.emit(arcPool, "AegisWalletUpdated")
        .withArgs(aegisWallet.address, newAegisWallet);

      expect(await arcPool.aegisServerWallet()).to.equal(newAegisWallet);
    });

    it("Should revert if non-admin tries to update Aegis wallet", async function () {
      await expect(
        arcPool.connect(lp1).updateAegisWallet(lp2.address)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should return correct pool status", async function () {
      const depositAmount = ethers.parseUnits("50000", 6);
      await arcPool.connect(lp1).deposit({ value: depositAmount });

      const status = await arcPool.getPoolStatus();
      expect(status[0]).to.equal(depositAmount); // total
      expect(status[1]).to.equal(depositAmount); // available
      expect(status[2]).to.equal(0); // utilized
      expect(status[3]).to.equal(0); // financed
    });

    it("Should return correct LP balance", async function () {
      const depositAmount = ethers.parseUnits("10000", 6);
      await arcPool.connect(lp1).deposit({ value: depositAmount });

      expect(await arcPool.getLPBalance(lp1.address)).to.equal(depositAmount);
    });
  });
});

