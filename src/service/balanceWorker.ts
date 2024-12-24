import dayjs, { Dayjs } from "dayjs";
import { parseMonetaryAmountFromString } from "../MonetaryAmount";
import { isExternalTransaction, isTransferTransaction, Transaction, TransactionSchema } from "../database/Transaction";
import { Account, AccountSchema, AccountType } from "../database/Account";

function fromRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllTransactions(): Promise<Transaction[]> {
    const infos = await indexedDB.databases();

    const dbInfo = infos
        .filter((info) => info.name?.includes("transactions"));
    
    if (dbInfo.length === 0) {
        throw `Could not find transactions database`;
    }

    const db = await fromRequest(indexedDB.open(dbInfo[0].name!));
    
    const objStore = db.transaction(["docs"]).objectStore("docs");

    const transactions = await fromRequest(objStore.getAll());

    return TransactionSchema.array().parse(transactions);
}

async function getAccount(accountId: string): Promise<Account> {
    const infos = await indexedDB.databases();

    const dbInfo = infos
        .filter((info) => info.name?.includes("accounts"));
    
    if (dbInfo.length === 0) {
        throw `Could not find accounts database`;
    }

    const db = await fromRequest(indexedDB.open(dbInfo[0].name!));

    const objStore = db.transaction(["docs"]).objectStore("docs");

    const accountDocument = await fromRequest(objStore.get(accountId));

    return AccountSchema.parse(accountDocument);
}

async function calculateBalance(accountId: string, period: [Dayjs, Dayjs]): Promise<bigint> {

    const account = await getAccount(accountId);

    const transactions = await getAllTransactions();

    transactions.sort((a, b) => a.date.unix() - b.date.unix());

    let balance = account.initialBalance as bigint;

    for (const transaction of transactions) {
        if (transaction.date.isAfter(period[1])) {
            continue;
        }

        if (isTransferTransaction(transaction)) {
            if (transaction.fromId === accountId) {
                switch (account.type) {
                    case "Ativo": {
                        balance -= transaction.value;
                    } break;

                    case "Passivo": {
                        balance += transaction.value;
                    } break;
                }
            } else if (transaction.toId === accountId) {
                switch (account.type) {
                    case "Ativo": {
                        balance += transaction.value;
                    } break;

                    case "Passivo": {
                        balance -= transaction.value;
                    } break;
                }
            }
        } else if (isExternalTransaction(transaction)) {
            if (transaction.accountId !== accountId) {
                continue;
            }

            switch (account.type) {
                case "Ativo": switch (transaction.type) {
                    case "Receita": {
                        balance += transaction.value;
                    } break;

                    case "Despesa": {
                        balance -= transaction.value;
                    } break;
                } break;
                
                case "Passivo": switch (transaction.type) {
                    case "Receita": {
                        balance -= transaction.value;
                    } break;

                    case "Despesa": {
                        balance += transaction.value;
                    } break;
                } break;
            }
        }
    }

    return balance;
}

addEventListener("message", (event) => {
    const { accountId, period } = event.data;

    calculateBalance(accountId, period.map((d: string) => dayjs(d).endOf("day")))
        .then((balance) => postMessage({
            accountId,
            balance,
        }));
});