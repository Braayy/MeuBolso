import { createForm, custom, pattern, required, SubmitHandler } from "@modular-forms/solid";
import { useNavigate } from "@solidjs/router";
import { rxDatabase } from "../../database";
import { parseMonetaryAmountFromInput } from "../../MonetaryAmount";
import { v4 as uuidv4 } from "uuid";
import classNames from "classnames";
import { TextField } from "../../component/TextField";
import { CurrencyField } from "../../component/CurrencyField";
import { Select } from "../../component/Select";
import { For, Show } from "solid-js";
import { Throbber } from "../../component/Throbber";
import { AccountType, AccountTypes } from "../../database/Account";

type NewAccountForm = {
    name: string;
    initialBalance: string;
    type: string;
};

export function NewAccountView() {
    const navigate = useNavigate();
    const [form, { Form, Field }] = createForm<NewAccountForm>();

    const handleSubmit: SubmitHandler<NewAccountForm> = async (values) => {
        await rxDatabase.accounts.insert({
            id: uuidv4(),
            name: values.name,
            initialBalance: parseMonetaryAmountFromInput(values.initialBalance).toString(),
            type: values.type as AccountType,
        });

        navigate("/accounts");
    };

    const styles = () => classNames("flex flex-col justify-center items-center gap-4 h-full", {
        "blur": form.submitting,
    });

    return (
        <div class="relative h-full">
            <Form onSubmit={handleSubmit} class={styles()}>
                <h1 class="text-4xl font-bold text-center">Criar uma nova conta</h1>

                <Field
                    name="name"
                    validate={[
                        required("Digite o nome da conta"),
                    ]}
                >
                    {(field, props) => (
                        <>
                            <TextField {...props} type="text" placeholder="Nome da Conta" />
                        </>
                    )}
                </Field>

                <Field
                    name="initialBalance"
                    validate={[
                        required("Digite o saldo inicial"),
                        pattern(/\d+,?\d{0,2}/, "Digite no formato correto"),
                    ]}
                >
                    {(field, props) => <CurrencyField {...props} type="text" placeholder="Saldo Inicial" />}
                </Field>

                <Field
                    name="type"
                    validate={[
                        custom((value) => !!value && AccountTypes.includes(value as any), "Escolha o tipo da conta"),
                    ]}
                >
                    {(field, props) => (
                        <Select {...props}>
                            <option disabled selected>Escolha o tipo da conta</option>
                            <For each={AccountTypes}>{(accountType) => (
                                <option value={accountType} selected={field.value === accountType}>{accountType}</option>
                            )}</For>
                        </Select>
                    )}
                </Field>

                <button type="submit" class="p-2 bg-june-bud text-xl rounded-lg">Criar nova conta</button>
            </Form>
            <Show when={form.submitting}>
                <div class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%]">
                    <Throbber size={50} />
                </div>
            </Show>
        </div>
    );
}