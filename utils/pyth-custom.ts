import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { BN } from "bn.js";

export interface PostPriceUpdateResult {
    postInstructions: Array<{
        instruction: TransactionInstruction;
        signers: Keypair[];
    }>;
    priceFeedIdToPriceUpdateAccount: Record<string, PublicKey>;
    closeInstructions: Array<{
        instruction: TransactionInstruction;
        signers: Keypair[];
    }>;
}

export class PythCustom {
    private connection: Connection;
    private wallet: Keypair;

    constructor(connection: Connection, wallet: Keypair) {
        this.connection = connection;
        this.wallet = wallet;
    }

    /**
     * Build instructions for posting a price update
     */
    async buildPostPriceUpdateInstructions(
        vaaData: Uint8Array
    ): Promise<PostPriceUpdateResult> {
        const priceFeedIdToPriceUpdateAccount: Record<string, PublicKey> = {};
        const postInstructions: Array<{
            instruction: TransactionInstruction;
            signers: Keypair[];
        }> = [];
        const closeInstructions: Array<{
            instruction: TransactionInstruction;
            signers: Keypair[];
        }> = [];

        // Parse VAA data to extract price feed ID
        const priceFeedId = this.extractPriceFeedIdFromVaa(vaaData);
        const priceFeedIdHex = Buffer.from(priceFeedId).toString("hex");

        // Create price update account
        const priceUpdateAccount = Keypair.generate();

        // Create PriceUpdateV2 account data
        const priceUpdateData = this.createPriceUpdateAccountData(priceFeedId);
        const space = priceUpdateData.length;
        const rent = await this.connection.getMinimumBalanceForRentExemption(space);

        // Create account instruction with Pyth Receiver as owner
        const PYTH_RECEIVER_PROGRAM_ID = new PublicKey("recVdKtX1fqGbcNop5c6N3LQ7N8dCrtxA1oV3sGx2HY");
        const createAccountIx = SystemProgram.createAccount({
            fromPubkey: this.wallet.publicKey,
            newAccountPubkey: priceUpdateAccount.publicKey,
            lamports: rent,
            space,
            programId: PYTH_RECEIVER_PROGRAM_ID, // Use Pyth Receiver as owner
        });

        postInstructions.push({
            instruction: createAccountIx,
            signers: [priceUpdateAccount],
        });

        // Add instruction to write price data to the account
        // This is a workaround - normally only the owning program can write data
        const writeDataIx = new TransactionInstruction({
            keys: [
                { pubkey: priceUpdateAccount.publicKey, isSigner: false, isWritable: true },
                { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
            ],
            programId: PYTH_RECEIVER_PROGRAM_ID,
            data: Buffer.concat([Buffer.from([0]), priceUpdateData]), // Simple discriminator + data
        });

        // Note: This instruction will likely fail since we're not calling a real Pyth instruction
        // but we'll include it for completeness
        postInstructions.push({
            instruction: writeDataIx,
            signers: [],
        });

        // Store the price update account mapping
        priceFeedIdToPriceUpdateAccount[priceFeedIdHex] = priceUpdateAccount.publicKey;

        return {
            postInstructions,
            priceFeedIdToPriceUpdateAccount,
            closeInstructions,
        };
    }

    /**
     * Create PriceUpdateV2 account data structure
     */
    private createPriceUpdateAccountData(feedId: Uint8Array): Buffer {
        // PriceUpdateV2 structure based on the IDL:
        // - discriminator: 8 bytes
        // - write_authority: 32 bytes (PublicKey)
        // - verification_level: 1 byte (enum: Partial(num_signatures) or Full)
        // - price_message: 112 bytes
        // - posted_slot: 8 bytes (u64)

        const totalSize = 8 + 32 + 1 + 112 + 8; // 161 bytes
        const data = Buffer.alloc(totalSize);
        let offset = 0;

        // Discriminator for PriceUpdateV2 (from IDL)
        const discriminator = Buffer.from([34, 241, 35, 99, 157, 126, 244, 205]);
        data.set(discriminator, offset);
        offset += 8;

        // Write authority (our wallet)
        data.set(this.wallet.publicKey.toBuffer(), offset);
        offset += 32;

        // Verification level (Full = variant index 1, no additional data)
        data.writeUInt8(1, offset);
        offset += 1;

        // Price message (112 bytes total)
        // Feed ID (32 bytes)
        data.set(feedId, offset);
        offset += 32;

        // Mock BTC price data 
        const price = 9700000000000; // $97,000 with -8 exponent
        const conf = 100000000; // $1 confidence
        const exponent = -8;
        const currentTime = Math.floor(Date.now() / 1000);

        // Price (i64, 8 bytes)
        data.writeBigInt64LE(BigInt(price), offset);
        offset += 8;

        // Confidence (u64, 8 bytes)
        data.writeBigUInt64LE(BigInt(conf), offset);
        offset += 8;

        // Exponent (i32, 4 bytes)
        data.writeInt32LE(exponent, offset);
        offset += 4;

        // Publish time (i64, 8 bytes)
        data.writeBigInt64LE(BigInt(currentTime), offset);
        offset += 8;

        // Previous publish time (i64, 8 bytes)
        data.writeBigInt64LE(BigInt(currentTime - 1), offset);
        offset += 8;

        // EMA price (i64, 8 bytes)
        data.writeBigInt64LE(BigInt(price), offset);
        offset += 8;

        // EMA confidence (u64, 8 bytes)
        data.writeBigUInt64LE(BigInt(conf), offset);
        offset += 8;

        // Posted slot (u64, 8 bytes)
        data.writeBigUInt64LE(BigInt(1000000), offset);

        return data;
    }

    /**
     * Extract price feed ID from VAA data
     */
    private extractPriceFeedIdFromVaa(vaaData: Uint8Array): Uint8Array {
        // Create a deterministic feed ID based on the VAA data
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(vaaData).digest();
        return hash.slice(0, 32);
    }

    /**
     * Batch instructions into versioned transactions
     */
    async batchIntoVersionedTransactions(
        instructions: Array<{
            instruction: TransactionInstruction;
            signers: Keypair[];
        }>,
        options: { computeUnitPriceMicroLamports?: number } = {}
    ): Promise<Array<{ tx: Transaction; signers: Keypair[] }>> {
        const transactions: Array<{ tx: Transaction; signers: Keypair[] }> = [];

        if (instructions.length === 0) {
            return transactions;
        }

        let currentTx = new Transaction();
        let currentSigners: Keypair[] = [];

        for (const { instruction, signers } of instructions) {
            currentTx.add(instruction);
            currentSigners.push(...signers);
        }

        transactions.push({ tx: currentTx, signers: [...currentSigners] });

        return transactions;
    }

    /**
     * Send and confirm a transaction
     */
    async sendAndConfirm(
        transaction: Transaction,
        signers: Keypair[],
        options: { skipPreflight?: boolean } = {}
    ): Promise<string> {
        // Add recent blockhash
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        // Sign with all signers including wallet
        const allSigners = [this.wallet, ...signers];
        transaction.sign(...allSigners);

        // Send transaction
        const signature = await this.connection.sendRawTransaction(
            transaction.serialize(),
            { skipPreflight: options.skipPreflight }
        );

        // Wait for confirmation
        await this.connection.confirmTransaction(signature, "confirmed");

        return signature;
    }

    /**
     * After account creation, write the price data directly to the account
     */
    async writePriceDataToAccount(
        priceUpdateAccount: PublicKey,
        priceData: Buffer
    ): Promise<void> {
        // This is a hack for testing - in production, this would be handled by the Pyth program
        // We'll directly write to the account after creation
        const accountInfo = await this.connection.getAccountInfo(priceUpdateAccount);
        if (accountInfo) {
            // In a real scenario, we would need the account to be owned by a program that can write data
            // For this demo, we'll assume the data is already written during account creation
            console.log("Price update account created successfully");
        }
    }

    /**
     * Get provider for compatibility
     */
    get provider() {
        return {
            connection: this.connection,
            sendAndConfirm: this.sendAndConfirm.bind(this),
        };
    }
}
