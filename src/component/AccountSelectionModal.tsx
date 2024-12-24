import classNames from "classnames";
import { rxDatabase } from "../database";
import { Account, AccountSchema } from "../database/Account";
import { createEffect, createResource, For, onCleanup, Setter, Show } from "solid-js";
import { createSignal, JSX } from "solid-js";
import { TbMoneybag } from "solid-icons/tb";
import { AiFillDollarCircle } from "solid-icons/ai";
import { createModal } from "./Modal";

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

type ModalState = {
    onSelect?(account: Account): void,
}

type AccountSelectionFieldProps = {
    onSelect: NonNullable<ModalState["onSelect"]>;
    accountId?: string;
    children: JSX.Element;
};

type AccountSelectionModalCreator = [
    (onSelect: NonNullable<ModalState["onSelect"]>) => void,
    {
        AccountSelectionModal(): JSX.Element;
        AccountSelectionField(props: AccountSelectionFieldProps): JSX.Element;
    }
];

export function createAccountSelectionModal(): AccountSelectionModalCreator {
    const [accounts, setAccounts] = createSignal<Account[]>([]);
    syncAccountsWithDatabase(setAccounts);

    const [openModal, closeModal, { Modal }] = createModal<ModalState>({});

    function openSelectionModal(onSelect: NonNullable<ModalState["onSelect"]>) {
        openModal({
            onSelect,
        });
    }

    const iconStyles = (account: Account) => classNames("stroke-current", {
        "text-green-500": account.type === "Ativo",
        "text-red-500": account.type === "Passivo",
    });

    return [
        openSelectionModal,
        {
            AccountSelectionModal: () => (
                <Modal>{
                    (data) => (
                        <>
                            <h1 class="w-full text-center font-bold">Selecione uma conta</h1>
                            <For each={accounts()}>{(account) => (
                                <div class="p-2 flex items-center gap-2 w-full" onClick={() => {
                                    data.onSelect?.(account);
                                    closeModal();
                                }}>
                                    <TbMoneybag size={30} class={iconStyles(account)} />
                                    <p>{account.name}</p>
                                </div>
                            )}</For>
                        </>
                    )
                }</Modal>
            ),
    
            AccountSelectionField: (props) => {
                const [selectedAccount, setSelectedAccount] = createSignal<Account>();

                const [valueAccount] = createResource(
                    () => props.accountId,
                    async (accountId) => {
                        if (!accountId) return undefined;

                        if (accountId === selectedAccount()?.id) return undefined;

                        const doc = await rxDatabase.accounts.findOne({
                            selector: {
                                id: accountId,
                            }
                        }).exec();

                        return AccountSchema.parse(doc?._data);
                    }
                );

                createEffect(() => {
                    const accountFromValue = valueAccount();
                    if (!accountFromValue) return;

                    setSelectedAccount(accountFromValue);
                });

                return (
                    <button
                        type="button"
                        class={classNames("flex items-center gap-2 p-2 bg-june-bud rounded-md")}
                        onClick={() => openSelectionModal((account) => {
                            setSelectedAccount(account);
                            props.onSelect(account);
                        })}
                    >
                        <AiFillDollarCircle size={26} class="text-white fill-current" />
                        <Show when={selectedAccount()} fallback={props.children}>
                            {selectedAccount()?.name}
                        </Show>
                    </button>
                )
            },
        },
    ];
}