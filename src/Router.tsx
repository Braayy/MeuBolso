import { Route, Router } from "@solidjs/router";
import { Root } from "./component/Root";
import { OverviewView } from "./view/Overview";
import { AccountsView } from "./view/accounts/AccountsView";
import { TransactionsView } from "./view/transactions/TransactionsView";
import { NewAccountView } from "./view/accounts/NewAccountView";
import { EditAccountView } from "./view/accounts/EditAccountView";
import { NewTransactionView } from "./view/transactions/NewTransactionView";
import { EditTransactionView } from "./view/transactions/EditTransactionView";

export function AppRouter() {
    return (
        <Router root={Root}>
            <Route path="/" component={OverviewView} />
            <Route path="/accounts">
                <Route path="/" component={AccountsView} />
                <Route path="/new" component={NewAccountView} />
                <Route path="/:id" component={EditAccountView} />
            </Route>
            <Route path="/transactions">
                <Route path="/" component={TransactionsView} />
                <Route path="/new" component={NewTransactionView} />
                <Route path="/:id" component={EditTransactionView} />
            </Route>
        </Router>
    );
}