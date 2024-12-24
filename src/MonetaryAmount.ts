import { z } from "zod";

export const MonetaryAmountSchema = z.bigint().brand<"MonetaryAmount">();

export type MonetaryAmount = z.infer<typeof MonetaryAmountSchema>;

export function parseMonetaryAmountFromInput(input: string): MonetaryAmount {
    const pattern = /(\d+),?(\d{0,2})/;

    const match = pattern.exec(input);
    if (!match) {
        throw `Invalid monetary input: ${input}`;
    }

    const integer = BigInt(match[1]);
    let decimal = BigInt(match[2]);

    if (decimal < 10) {
        decimal *= 10n;
    }

    const value = integer * 100n + decimal;

    return value as MonetaryAmount;
}

export function parseMonetaryAmountFromString(value: string): MonetaryAmount {
    if (value.length < 2) {
        throw `Invalid Monetary Amount: ${value}`;
    }

    try {
        return BigInt(value) as MonetaryAmount;
    } catch (err) {
        throw `Invalid Monetary Amount: ${value}`;
    }
}

export function formatMonetaryAmount(value: MonetaryAmount, symbol: boolean = false): string {
    if (value >= 0 && value < 10) {
        return `${symbol ? "R$ " : ""}0,${value.toString().padStart(2, "0")}`;
    }

    const pattern = /(\d*)(\d{2})/;

    const [_, integerPart, decimalPart] = pattern.exec(value.toString())!;

    const integer = Number(integerPart).toLocaleString("pt-br");

    return `${symbol ? "R$ " : ""}${value < 0 ? "-" : ""}${integer},${decimalPart.padStart(2, "0")}`;
}

export const MonetaryAmountFromStringTransformer = z.string().transform((value) => parseMonetaryAmountFromString(value));

export const MonetaryAmountToStringTransformer = MonetaryAmountSchema.transform((value) => value.toString());