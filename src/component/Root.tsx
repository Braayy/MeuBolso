import { A, RouteSectionProps } from "@solidjs/router";
import { AiFillDollarCircle, AiFillHome } from "solid-icons/ai";
import { FaSolidMoneyBill1Wave } from "solid-icons/fa";

export function Root(props: RouteSectionProps) {
    return (
        <div class="mx-auto sm:w-full md:w-[640px] p-2 border h-full flex flex-col">
            <div class="flex-grow">
                {props.children}
            </div>
            <div class="w-full bottom-0 flex items-center justify-center gap-2 bg-white">
                <A href="/transactions" class="flex flex-col items-center p-2">
                    <FaSolidMoneyBill1Wave size={26} class="text-june-bud fill-current" />
                    Lançamentos
                </A>
                <A href="/" class="flex flex-col items-center p-2">
                    <AiFillHome size={26} class="text-june-bud fill-current" />
                    Visão Geral
                </A>
                <A href="/accounts" class="flex flex-col items-center p-2">
                    <AiFillDollarCircle size={26} class="text-june-bud fill-current" />
                    Contas
                </A>
            </div>
        </div>
    );
}