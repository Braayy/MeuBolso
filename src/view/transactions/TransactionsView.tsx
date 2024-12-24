import { createResource, createSignal, For, Match, onCleanup, Switch } from "solid-js";
import { rxDatabase } from "../../database";
import { AiFillPlusCircle } from "solid-icons/ai";
import { useNavigate } from "@solidjs/router";
import { Setter } from "solid-js";
import { formatMonetaryAmount } from "../../MonetaryAmount";
import { FaSolidMoneyBill, FaSolidMoneyBillTransfer } from "solid-icons/fa";
import classNames from "classnames";
import { isExternalTransaction, isTransferTransaction, Transaction, TransactionSchema } from "../../database/Transaction";

function syncTransactionsWithDatabase(setTransactions: Setter<Transaction[]>) {
    const sub = rxDatabase.transactions.find({
        sort: [],
    }).$.subscribe((transactionDocuments) => setTransactions(
        transactionDocuments
            .map((transactionDocument) => TransactionSchema.parse(transactionDocument._data))
    ));

    onCleanup(() => sub.unsubscribe());
}

export function TransactionCard(props: {
    transaction: Transaction,
    onClick: () => void,
}) {
    const [accountNames] = createResource(async () => {
        if (isTransferTransaction(props.transaction)) {
            const fromDoc = await rxDatabase.accounts.findOne({
                selector: {
                    id: props.transaction.fromId,
                }
            }).exec();

            const toDoc = await rxDatabase.accounts.findOne({
                selector: {
                    id: props.transaction.toId,
                }
            }).exec();

            const fromAccountName = fromDoc && fromDoc._data.name;
            const toAccountName = toDoc && toDoc._data.name;

            return [fromAccountName ?? "Conta não encontrada", toAccountName ?? "Conta não encontrada"]
        } else if (isExternalTransaction(props.transaction)) {
            const doc = await rxDatabase.accounts.findOne({
                selector: {
                    id: props.transaction.accountId,
                }
            }).exec();

            const accountName = doc && doc._data.name;

            return [accountName ?? "Conta não encontrada"];
        }
    });

    const iconStyles = () => classNames("stroke-current", {
        "text-green-500": isExternalTransaction(props.transaction) && props.transaction.type === "Receita",
        "text-red-500": isExternalTransaction(props.transaction) && props.transaction.type === "Despesa",
        "text-gray-400": isTransferTransaction(props.transaction),
    });

    return (
        <div class="flex items-center bg-gray-100 rounded-md p-3 gap-2 w-full" onClick={props.onClick}>
            <Switch>
                <Match when={isTransferTransaction(props.transaction)}>
                    <FaSolidMoneyBillTransfer size={30} class={iconStyles()}  />
                </Match>

                <Match when={isExternalTransaction(props.transaction) && props.transaction.type === "Despesa"}>
                    <FaSolidMoneyBill size={30} class={iconStyles()} />
                </Match>

                <Match when={isExternalTransaction(props.transaction) && props.transaction.type === "Receita"}>
                    <FaSolidMoneyBill size={30} class={iconStyles()} />
                </Match>
            </Switch>
            <div class="flex flex-col">
                <Switch>
                    <Match when={isTransferTransaction(props.transaction)}>
                        <p>{props.transaction.date.format("DD/MM/YYYY")} - {`${(accountNames() ?? [""])[0]} -> ${(accountNames() ?? [,""])[1]}`}</p>
                    </Match>

                    <Match when={isExternalTransaction(props.transaction)}>
                        <p>{props.transaction.date.format("DD/MM/YYYY")} - {(accountNames() ?? [""])[0]}</p>
                    </Match>
                </Switch>
                <p>{props.transaction.description} - {formatMonetaryAmount(props.transaction.value, true)}</p>
            </div>
        </div>
    );
}

export function TransactionsView() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = createSignal<Transaction[]>([]);

    syncTransactionsWithDatabase(setTransactions);

    function handleTransactionClick(transaction: Transaction) {
        navigate("/transactions/" + transaction.id);
    }

    function handleNewAccount() {
        navigate("/transactions/new");
    }

    return (
        <div class="flex flex-col items-center h-full gap-2 relative">
            <For each={transactions()}>{(transaction) => (
                <TransactionCard transaction={transaction} onClick={() => handleTransactionClick(transaction)} />
            )}</For>

            <button class="absolute bottom-5 right-5" onClick={handleNewAccount}>
                <AiFillPlusCircle size={70} class="text-june-bud fill-current" />
            </button>
        </div>
    );
}