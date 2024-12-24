import BalanceWorker from "./balanceWorker?worker";
import { Dayjs } from "dayjs";
import { Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import { MonetaryAmount } from "../MonetaryAmount";

const worker = new BalanceWorker();

export function createBalanceCalculator(accountId: string, period: Accessor<[Dayjs, Dayjs]>): Accessor<MonetaryAmount> {
    const [balance, setBalance] = createSignal<bigint>(0n);

    createEffect(() => {
        worker.postMessage({
            accountId,
            period: period().map((d) => d.format("DD/MM/YYYY")),
        });
    });

    function handleMessage(event: MessageEvent) {
        if (event.data.accountId === accountId) {
            setBalance(event.data.balance);
        }
    }

    worker.addEventListener("message", handleMessage);

    onCleanup(() => {
        worker.removeEventListener("message", handleMessage);
    });

    return balance as Accessor<MonetaryAmount>;    
}