import type { BunFile } from "bun";
import type { Account, Transaction } from "./types";

export class Storage {
    public accounts: Account[] = [];
    public transactions: Transaction[] = [];
    private file: BunFile;
    
    constructor(filename: string) {
        this.file = Bun.file(filename);
    }

    public getAccountById(id: number): Account | null {
        return this.accounts.filter((account) => account.id === id)[0] ?? null;
    }

    public async load() {
        if (!(await this.file.exists())) {
            return;
        }

        const data = await this.file.json();

        this.accounts = data.accounts
            .map((account: any) => ({
                ...account,
                initialBalance: BigInt(account.initialBalance),
            }));
        
        this.transactions = data.transactions
            .map((transaction: any) => ({
                ...transaction,
                value: BigInt(transaction.value),
                date: new Date(transaction.date),
            }));
    }

    public async save() {
        const data = {
            accounts: this.accounts,
            transactions: this.transactions,
        };

        const content = JSON.stringify(data, (_, value) => {
            if (typeof value === "bigint") {
                return value.toString();
            }

            if (value instanceof Date) {
                return value.getDate();
            }

            return value;
        }, 2);

        await Bun.write(this.file, content);
    }
}