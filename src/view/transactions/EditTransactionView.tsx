import { RouteSectionProps, useNavigate } from "@solidjs/router";
import { v4 as uuidv4 } from "uuid";
import { createAccountSelectionModal } from "../../component/AccountSelectionModal";
import { createModal } from "../../component/Modal";
import { createEffect, createResource, createSignal, For, Match, Show } from "solid-js";
import { createCustomForm, custom, monetaryAmount, pattern, required } from "../../component/CustomForm";
import { rxDatabase } from "../../database";
import { ExternalTransactionType, ExternalTransactionTypes, isExternalTransaction, isTransferTransaction, TransactionDocumentType, TransactionSchema } from "../../database/Transaction"
import { formatMonetaryAmount, parseMonetaryAmountFromInput } from "../../MonetaryAmount";
import classNames from "classnames";
import { FaSolidArrowRightArrowLeft } from "solid-icons/fa";
import { BsBoxArrowUp } from "solid-icons/bs";
import { TextField } from "../../component/TextField";
import { CurrencyField } from "../../component/CurrencyField";
import { Switch } from "solid-js";
import { Select } from "../../component/Select";
import { Throbber } from "../../component/Throbber";
import { RxDocument } from "rxdb";

type EditTransactionForm = {
    date: string;
    description: string;
    value: string;

    accountId: string;
    type: string;
    
    fromId: string;
    toId: string;
};

export function EditTransactionView(props: RouteSectionProps) {
    const navigate = useNavigate();

    const [, { AccountSelectionModal, AccountSelectionField }] = createAccountSelectionModal();

    const [openErrorModal,, { Modal: ErrorModal }] = createModal<{ messages: string[] }>({
        messages: [],
    });

    const [transactionType, setTransactionType] = createSignal("Externa");
    
    const [form, { Form, FormField }] = createCustomForm<EditTransactionForm>({
        async onSubmit(values) {
            if (transactionType() === "Externa") {
                await rxDatabase.transactions.insert({
                    id: uuidv4(),
                    date: "",
                    description: values.description,
                    value: parseMonetaryAmountFromInput(values.value).toString(),
                    type: values.type as ExternalTransactionType,
                    accountId: values.accountId,
                });
            } else if (transactionType() === "Transferência") {
                if (values.fromId === values.toId) {
                    throw "As contas selecionadas são iguais";
                }

                await rxDatabase.transactions.insert({
                    id: uuidv4(),
                    date: "",
                    description: values.description,
                    value: parseMonetaryAmountFromInput(values.value).toString(),
                    fromId: values.fromId,
                    toId: values.toId,
                });
            }

            navigate("/transactions");
        },

        async onError(errors) {
            if (Array.isArray(errors)) {
                const messages = errors.map((error) => error.message ?? `Campo ${error.name} invalido`);

                openErrorModal({
                    messages,
                });
            } else {
                openErrorModal({
                    messages: [errors]
                });
            }
        },
    });

    const [transactionDocument] = createResource(async () => {
        const doc = await rxDatabase.transactions.findOne({
            selector: {
                id: props.params.id,
            }
        }).exec();

        return doc as RxDocument<TransactionDocumentType>;
    });

    createEffect(() => {
        const transactionDoc = transactionDocument();
        if (!transactionDoc) return;

        const transaction = TransactionSchema.parse(transactionDoc._data);

        form.setFieldValue("date", transaction.date.format("YYYY-MM-DD"));
        form.setFieldValue("description", transaction.description);
        form.setFieldValue("value", formatMonetaryAmount(transaction.value));

        if (isTransferTransaction(transaction)) {   
            setTransactionType("Transferência");
            form.setFieldValue("fromId", transaction.fromId);
            form.setFieldValue("toId", transaction.toId);
        } else {
            setTransactionType("Externa");
            form.setFieldValue("accountId", transaction.accountId);
            form.setFieldValue("type", transaction.type);
        }
    });

    createEffect(() => {
        const transactionDoc = transactionDocument();
        if (!transactionDoc) return;

        const transaction = TransactionSchema.parse(transactionDoc._data);

        if (transactionType() === "Transferência" && isTransferTransaction(transaction)) {
            form.setFieldValue("fromId", transaction.fromId);
            form.setFieldValue("toId", transaction.toId);
        } else if (transactionType() === "Externa" && isExternalTransaction(transaction)) {
            form.setFieldValue("accountId", transaction.accountId);
            form.setFieldValue("type", transaction.type);
        }
    });

    const formStyles = () => classNames("flex flex-col justify-center items-center gap-4 h-full", {
        "blur": form.submitting,
    });

    const transactionTypeStyles = (type: string) => classNames("flex flex-col items-center p-2 rounded-md bg-june-bud", {
        "bg-june-bud-darken": transactionType() === type,
    });

    return (
        <>
            <div class="relative h-full">
                <Form class={formStyles()}>
                    <h1 class="text-4xl font-bold text-center">Alterar Lançamento</h1>

                    <div class="flex gap-3">
                        <button type="button" class={transactionTypeStyles("Transferência")} onClick={() => setTransactionType("Transferência")}>
                            <FaSolidArrowRightArrowLeft class="text-white stroke-current" size={20} />
                            Transferência
                        </button>
                        <button type="button" class={transactionTypeStyles("Externa")} onClick={() => setTransactionType("Externa")}>
                            <BsBoxArrowUp class="text-white stroke-current" size={20} />
                            Externa
                        </button>
                    </div>

                    <FormField
                        name="date"
                        validation={[
                            required("A data não foi escolhida")
                        ]}
                    >{
                        (field) => (
                            <TextField
                                type="date"
                                placeholder="Data"
                                onInput={(event) => (field.value = event.currentTarget.value)}
                                value={field.value}
                            />
                        )
                    }</FormField>

                    <FormField
                        name="description"
                        validation={[
                            required("A descrição está vazia")
                        ]}
                    >{
                        (field) => (
                            <TextField
                                type="text"
                                placeholder="Descrição"
                                onInput={(event) => (field.value = event.currentTarget.value)}
                                value={field.value}
                            />
                        )
                    }</FormField>

                    <FormField
                        name="value"
                        validation={[
                            required("O valor da transação está vazio"),
                            pattern(/\d+,?\d{0,2}/, "O valor da transação está no formato incorreto"),
                            monetaryAmount("O valor da transação deve ser positivo"),
                        ]}
                    >{
                        (field) => (
                            <CurrencyField
                                placeholder="Valor"
                                onInput={(event) => (field.value = event.currentTarget.value)}
                                value={field.value}
                            />
                        )
                    }</FormField>

                    <Switch>
                        <Match when={transactionType() === "Transferência"}>
                            <FormField
                                name="fromId"
                                validation={[
                                    required("Selecione a conta de saída")
                                ]}
                            >{
                                (field) => (
                                    <AccountSelectionField onSelect={(account) => field.value = account.id} accountId={field.value}>Conta de Saída</AccountSelectionField>
                                )
                            }</FormField>

                            <FormField
                                name="toId"
                                validation={[
                                    required("Selecione a conta de entrada")
                                ]}
                            >{
                                (field) => (
                                    <AccountSelectionField onSelect={(account) => field.value = account.id} accountId={field.value}>Conta de Entrada</AccountSelectionField>
                                )
                            }</FormField>
                        </Match>

                        <Match when={transactionType() === "Externa"}>
                            <FormField
                                name="type"
                                validation={[
                                    custom((value) => !!value && ExternalTransactionTypes.includes(value as any), "Escolha o tipo do lançamento"),
                                ]}
                            >
                                {(field) => (
                                    <Select onChange={(event) => (field.value = event.currentTarget.value)}>
                                        <option disabled selected>Escolha o tipo do lançamento</option>
                                        <For each={ExternalTransactionTypes}>{(externalTransactionType) => (
                                            <option value={externalTransactionType} selected={field.value === externalTransactionType}>{externalTransactionType}</option>
                                        )}</For>
                                    </Select>
                                )}
                            </FormField>

                            <FormField
                                name="accountId"
                                validation={[
                                    required("Selecione uma conta")
                                ]}
                            >{
                                (field) => (
                                    <AccountSelectionField onSelect={(account) => field.value = account.id} accountId={field.value}>Conta</AccountSelectionField>
                                )
                            }</FormField>
                        </Match>
                    </Switch>

                    <button type="submit" class="p-2 bg-june-bud text-xl rounded-lg">Alterar</button>
                </Form>

                <Show when={form.submitting}>
                    <div class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]">
                        <Throbber size={50} />
                    </div>
                </Show>
            </div>

            <AccountSelectionModal />

            <ErrorModal>{
                (data) => (
                    <>
                        <h1 class="w-full text-center font-bold">Foram encontrados os seguintes erros:</h1>
                        <For each={data.messages}>{(message) => (
                            <p>{message}</p>
                        )}</For>
                    </>
                )
            }</ErrorModal>
        </>
    );
}