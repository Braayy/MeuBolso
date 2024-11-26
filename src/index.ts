import { input, select, Separator } from "@inquirer/prompts";
import { clearScreen as ansiClearScreen } from "ansi-escapes";
import { Storage } from "./storage";
import type { Account, AccountType, ExternalTransaction, Transaction, TransferTransaction } from "./types";
import { setTimeout } from "node:timers/promises";

const VERSION = "0.0.1";

async function clearScreen() {
    await Bun.write(Bun.stdout, ansiClearScreen);
}

function parseCurrency(input: string): bigint | null {
    const pattern = /(\d+),?(\d{0,2})/;

    const match = pattern.exec(input);
    if (!match) {
        return null;
    }

    const integer = BigInt(match[1]);
    let decimal = BigInt(match[2]);

    if (decimal < 10) {
        decimal *= 10n;
    }

    return integer * 100n + decimal;
}

const MENUS: { [key: number]: (storage: Storage) => Promise<void> } = {
    1: async (storage) => {
        const name = await input({ message: "Digite o nome da conta:" });

        const type: AccountType = await select({
            message: "Selecione o tipo da conta",
            choices: [
                "Ativo",
                "Passivo",
            ],
        });

        const initialBalanceRaw = await input({
            message: "Digite o saldo inicial: R$",
            validate(value) {
                if (parseCurrency(value) === null) {
                    return "Formato Invalido!";
                }
                
                return true;
            }
        });

        const initialBalance = parseCurrency(initialBalanceRaw)!;

        const account: Account = {
            id: storage.accounts.length,
            name,
            type,
            initialBalance,
        };

        storage.accounts.push(account);
        await storage.save();
    },

    2: async (storage) => {
        const option = await select({
            message: "Selecione uma conta",
            choices: [
                ...storage.accounts.map((account) => ({
                    name: account.name,
                    value: account.id,
                    description: `Saldo Atual: R$ ${formatCurrency(getBalance(account.id, storage))}`
                })),
                { name: "Voltar", value: -1 }
            ]
        });

        if (option === -1) {
            return;
        }

        await clearScreen();

        const account = storage.getAccountById(option)!;

        const name = await input({
            message: "Digite o nome da conta:",
            default: account.name,
        });

        const type: AccountType = await select({
            message: "Selecione o tipo da conta",
            default: account.type,
            choices: [
                "Ativo",
                "Passivo",
            ],
        });

        const initialBalanceRaw = await input({
            message: "Digite o saldo inicial: R$",
            default: formatCurrency(account.initialBalance),
            validate(value) {
                if (parseCurrency(value) === null) {
                    return "Formato Invalido!";
                }
                
                return true;
            }
        });

        const initialBalance = parseCurrency(initialBalanceRaw)!;

        account.name = name;
        account.type = type;
        account.initialBalance = initialBalance;
        await storage.save();
    },

    3: async (storage) => {
        const type = await select({
            message: "Selecione o tipo da transação",
            choices: [
                { value: "Transferência", disabled: storage.accounts.length === 1 },
                { value: "Receita" },
                { value: "Despesa" },
                { value: "Sair" },
            ],
        });

        if (type === "Sair") {
            return;
        }

        if (type === "Transferência") {
            const from = await select({
                message: "Selecione de qual conta",
                choices: storage.accounts.map((account) => ({ name: account.name, value: account.id })),
            });

            const to = await select({
                message: "Selecione para qual conta",
                choices: storage.accounts
                    .filter((account) => account.id !== from)
                    .map((account) => ({ name: account.name, value: account.id })),
            });

            const valueRaw = await input({
                message: "Digite o valor: R$",
                validate(value) {
                    if (parseCurrency(value) === null) {
                        return "Formato Invalido!";
                    }
                    
                    return true;
                }
            });
    
            const value = parseCurrency(valueRaw)!;

            const transaction: TransferTransaction = {
                type: "Transferência",
                fromId: from,
                toId: to,
                value,
            }

            storage.transactions.push(transaction);

            await storage.save();
            return;
        }

        const accountId = await select({
            message: "Selecione a conta",
            choices: storage.accounts.map((account) => ({ name: account.name, value: account.id })),
        });

        const valueRaw = await input({
            message: "Digite o valor: R$",
            validate(value) {
                if (parseCurrency(value) === null) {
                    return "Formato Invalido!";
                }
                
                return true;
            }
        });

        const value = parseCurrency(valueRaw)!;

        const transaction = {
            type: type as ExternalTransaction["type"],
            date: new Date(),
            accountId,
            value,
        };

        storage.transactions.push(transaction);

        await storage.save();
    },
};

function getBalance(accountId: number, storage: Storage): bigint {
    const account = storage.getAccountById(accountId)!;

    let balance = account.initialBalance;

    for (const transaction of storage.transactions) {
        switch (transaction.type) {
            case "Receita": {
                if (transaction.accountId === accountId) {
                    balance += transaction.value;
                }
            } break;

            case "Despesa": {
                if (transaction.accountId === accountId) {
                    balance -= transaction.value;
                }
            } break;

            case "Transferência": {
                if (transaction.fromId === accountId) {
                    balance -= transaction.value;
                } else if (transaction.toId === accountId) {
                    balance += transaction.value;
                }
            } break;
        }
    }

    return balance;
}

function formatCurrency(value: bigint): string {
    const pattern = /(\d*)(\d{2})/;

    const [_, integer, decimal] = pattern.exec(value.toString())!;

    return `${integer ?? 0},${decimal}`;
}

async function main() {
    const storage = new Storage("database.json");
    await storage.load();

    while (true) {
        await clearScreen();
        console.log(`Meu Bolso ${VERSION}`);

        const option = await select({
            message: "Menu Principal",
            pageSize: 10,
            choices: [
                new Separator(),
                { name: "Nova Conta", value: 1 },
                { name: "Gerenciar Contas", value: 2 },
                new Separator(),
                { name: "Registrar Transação", value: 3 },
                { name: "Alterar Transação", value: 4 },
                new Separator(),
                { name: "Gerar Relatório", value: 5 },
                new Separator(),
                { name: "Sair", value: 0 },
            ]
        });

        if (option === 0) {
            break;
        }

        const selectedMenu = MENUS[option];
        if (!selectedMenu) {
            continue;
        }

        await clearScreen();
        await selectedMenu(storage);
    }

    await storage.save();
}

main();
