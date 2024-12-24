import {  createSignal, For, onCleanup, Setter } from "solid-js";
import { rxDatabase } from "../../database";
import { AiFillPlusCircle } from "solid-icons/ai";
import { useNavigate } from "@solidjs/router";
import classNames from "classnames";
import { TbMoneybag } from "solid-icons/tb";
import { createBalanceCalculator } from "../../service/balance";
import dayjs, { Dayjs } from "dayjs";
import { formatMonetaryAmount } from "../../MonetaryAmount";
import { Account, AccountSchema } from "../../database/Account";

type Period = [Dayjs, Dayjs];

function syncAccountsWithDatabase(setAccounts: Setter<Account[]>) {
    const sub = rxDatabase.accounts.find({
        sort: [
            { name: "desc", type: "asc"  }
        ],
    }).$.subscribe((accountDocuments) => setAccounts(
        accountDocuments
            .map((accountDocument) => AccountSchema.parse(accountDocument._data))
    ));

    onCleanup(() => sub.unsubscribe());
}

function AccountCard(props: {
    period: Period,
    account: Account,
    onClick: () => void,
}) {
    const balance = createBalanceCalculator(props.account.id, () => props.period);

    const iconStyles = () => classNames("stroke-current", {
        "text-green-500": props.account.type === "Ativo",
        "text-red-500": props.account.type === "Passivo",
    });

    return (
        <div class="flex items-center bg-gray-100 rounded-md py-3 gap-2 w-full" onClick={props.onClick}>
            <TbMoneybag size={30} class={iconStyles()} />
            <p>{props.account.name} - {formatMonetaryAmount(balance(), true)}</p>
        </div>
    );
}

export function AccountsView() {
    const [period, setPeriod] = createSignal<Period>([dayjs().startOf("month"), dayjs().endOf("month")]);
    const [accounts, setAccounts] = createSignal<Account[]>([]);
    const navigate = useNavigate();

    // setTimeout(() => {
    //     setPeriod([
    //         dayjs().subtract(1, "month").startOf("month"),
    //         dayjs().subtract(1, "month").endOf("month"),
    //     ]);
    // }, 5000);

    syncAccountsWithDatabase(setAccounts);

    function handleNewAccount() {
        navigate("/accounts/new");
    }

    function handleAccountClick(account: Account) {
        navigate(`/accounts/${account.id}`);
    }

    return (
        <div class="flex flex-col items-center h-full gap-2 relative">
            <For each={accounts()}>{(account) => (
                <AccountCard period={period()} account={account} onClick={() => handleAccountClick(account)} />
            )}</For>

            <button class="absolute bottom-5 right-5" onClick={handleNewAccount}>
                <AiFillPlusCircle size={70} class="text-june-bud fill-current" />
            </button>
        </div>
    );
}