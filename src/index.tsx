/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import { AppRouter } from "./Router.tsx";

const root = document.getElementById("root");

render(() => <AppRouter />, root!);
