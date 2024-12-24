import { useNavigate } from "@solidjs/router";
import { v4 as uuidv4 } from "uuid";
import { createAccountSelectionModal } from "../../component/AccountSelectionModal";
import { createModal } from "../../component/Modal";
import { createSignal, For, Match, Show } from "solid-js";
import { createCustomForm, custom, monetaryAmount, pattern, required } from "../../component/CustomForm";
import { rxDatabase } from "../../database";
import { ExternalTransactionDocumentSchema, ExternalTransactionTypes, TransferTransactionDocumentSchema } from "../../database/Transaction";
import { parseMonetaryAmountFromInput } from "../../MonetaryAmount";
import classNames from "classnames";
import { FaSolidArrowRightArrowLeft } from "solid-icons/fa";
import { BsBoxArrowUp } from "solid-icons/bs";
import { TextField } from "../../component/TextField";
import { CurrencyField } from "../../component/CurrencyField";
import { Switch } from "solid-js";
import { Select } from "../../component/Select";
import { Throbber } from "../../component/Throbber";
import dayjs from "dayjs";

type NewTransactionForm = {
    date: string;
    description: string;
    value: string;

    accountId: string;
    type: string;
    
    fromId: string;
    toId: string;
};

export function NewTransactionView() {
    const navigate = useNavigate();

    const [, { AccountSelectionModal, AccountSelectionField }] = createAccountSelectionModal();

    const [openErrorModal,, { Modal: ErrorModal }] = createModal<{ messages: string[] }>({
        messages: [],
    });

    const [transactionType, setTransactionType] = createSignal("Externa");
    
    const [form, { Form, FormField }] = createCustomForm<NewTransactionForm>({
        async onSubmit(values) {
            if (transactionType() === "Externa") {
                await rxDatabase.transactions.insert(ExternalTransactionDocumentSchema.parse({
                    id: uuidv4(),
                    date: dayjs(values.date),
                    description: values.description,
                    value: parseMonetaryAmountFromInput(values.value),
                    type: values.type,
                    accountId: values.accountId,
                }));
            } else if (transactionType() === "Transferência") {
                if (values.fromId === values.toId) {
                    throw "As contas selecionadas são iguais";
                }

                await rxDatabase.transactions.insert(TransferTransactionDocumentSchema.parse({
                    id: uuidv4(),
                    date: dayjs(values.date),
                    description: values.description,
                    value: parseMonetaryAmountFromInput(values.value),
                    fromId: values.fromId,
                    toId: values.toId,
                }));
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
                    <h1 class="text-4xl font-bold text-center">Registrar Lançamento</h1>

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
                                    <AccountSelectionField onSelect={(account) => field.value = account.id}>Conta de Saída</AccountSelectionField>
                                )
                            }</FormField>

                            <FormField
                                name="toId"
                                validation={[
                                    required("Selecione a conta de entrada")
                                ]}
                            >{
                                (field) => (
                                    <AccountSelectionField onSelect={(account) => field.value = account.id}>Conta de Entrada</AccountSelectionField>
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
                                    <AccountSelectionField onSelect={(account) => field.value = account.id}>Conta</AccountSelectionField>
                                )
                            }</FormField>
                        </Match>
                    </Switch>

                    <button type="submit" class="p-2 bg-june-bud text-xl rounded-lg">Lançar</button>
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