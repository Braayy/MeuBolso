export type AccountType = "Ativo" | "Passivo";

export type Account = {
    id: number,
    name: string,
    type: AccountType,
    initialBalance: bigint,
};

export type TransferTransaction = {
    type: "Transferência",
    fromId: number,
    toId: number,
    value: bigint,
};

export type ExternalTransaction = {
    type: "Receita" | "Despesa",
    date: Date,
    accountId: number,
    value: bigint,
};

export type Transaction = TransferTransaction | ExternalTransaction;

export type TransactionType = Transaction["type"];

