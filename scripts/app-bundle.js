var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('withdrawl-form',["require", "exports", "./shared/decimal", "aurelia-framework", "aurelia-dialog", "aurelia-event-aggregator", "./lib/util", "./lib/api-service", "./shared/DataContainer", "./shared/Currency", "./shared/ClientMessage"], function (require, exports, decimal_1, aurelia_framework_1, aurelia_dialog_1, aurelia_event_aggregator_1, util_1, api_service_1, DataContainer_1, Currency_1, ClientMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WithdrawlForm = (function () {
        function WithdrawlForm(controller, util, ea, apiService) {
            var _this = this;
            this.controller = controller;
            this.util = util;
            this.ea = ea;
            this.apiService = apiService;
            this.loading = true;
            this.accounts = [];
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.AccountWithdrawlResult, function (r) { return _this.handleAccountWithdrawlResult(r); }));
            this.subscriptions.push(ea.subscribe(DataContainer_1.CashOutRequestResult, function (r) { return _this.handleCashOutRequestResult(r); }));
        }
        WithdrawlForm.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        WithdrawlForm.prototype.handleCashOutRequestResult = function (result) {
            this.accounts = [];
            this.loading = false;
            for (var _i = 0, _a = result.accounts; _i < _a.length; _i++) {
                var account = _a[_i];
                var view = Object.assign({}, account);
                view.balance = this.util.fromSmallest(account.balance, account.currency),
                    this.accounts.push(view);
            }
            var validAccounts = this.accounts.filter(function (acc) { return !acc.insufficientBalance; });
            this.insufficientBalance = validAccounts.length == 0;
            if (this.accounts.length == 0 || this.accounts.every(function (x) { return new decimal_1.Decimal(x.balance).equals(0); })) {
                this.errorMessage = "You do not have any account balances!";
            }
            else if (validAccounts.length == 0) {
                this.errorMessage = "Your balance is insufficient to cash out.";
            }
            if (validAccounts.length === 1) {
                validAccounts[0].checked = true;
                this.setRefundAddress(validAccounts[0]);
            }
        };
        WithdrawlForm.prototype.accountChecked = function (view) {
            for (var _i = 0, _a = this.accounts.filter(function (acc) { return acc != view; }); _i < _a.length; _i++) {
                var account = _a[_i];
                account.checked = false;
            }
            this.setRefundAddress(view);
            this.withdrawlAmount = view.checked ? parseFloat(view.balance) : null;
        };
        WithdrawlForm.prototype.setRefundAddress = function (view) {
            if (view.checked) {
                this.withdrawlAmount = parseFloat(view.balance);
                this.refundAddress = view.refundAddress;
                this.refundAddressCount = view.refundAddressCount;
                this.receivingAddress = view.refundAddress;
            }
            else {
                this.withdrawlAmount = null;
                this.refundAddress = null;
                this.refundAddressCount = null;
                this.receivingAddress = null;
            }
        };
        WithdrawlForm.prototype.withdraw = function () {
            this.errorMessage = '';
            var account;
            if (this.accounts.length > 1) {
                account = this.accounts.find(function (acc) { return acc.checked; });
            }
            else {
                account = this.accounts[0];
            }
            if (!account) {
                this.errorMessage = 'Please select an account to withdraw';
                return;
            }
            if (!this.receivingAddress) {
                this.errorMessage = "Please provide a receiving address";
                return;
            }
            if (!this.withdrawlAmount || this.withdrawlAmount < 0) {
                this.errorMessage = "Please provide a withdrawl amount";
                return;
            }
            this.inProgress = true;
            this.cashingOutInfo = 'Withdrawl in progress...please wait';
            this.currency = account.currency;
            var accountWithdrawlRequest = new ClientMessage_1.AccountWithdrawlRequest();
            accountWithdrawlRequest.currency = this.currency;
            accountWithdrawlRequest.receivingAddress = this.receivingAddress;
            accountWithdrawlRequest.amount = new decimal_1.Decimal(this.withdrawlAmount).mul(Currency_1.CurrencyUnit.default).toString();
            this.apiService.send(accountWithdrawlRequest);
        };
        WithdrawlForm.prototype.handleAccountWithdrawlResult = function (result) {
            this.result = result;
            this.inProgress = false;
            this.success = result.success;
            this.cashingOutInfo = '';
            this.errorMessage = result.errorMessage;
            if (result.success) {
                this.amountSent = parseFloat(result.sentAmount);
                this.txHash = result.txHash;
                this.balance = parseFloat(result.balance);
                this.txHashLink = result.txHashLink;
            }
        };
        WithdrawlForm = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, util_1.Util, aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService])
        ], WithdrawlForm);
        return WithdrawlForm;
    }());
    exports.WithdrawlForm = WithdrawlForm;
});



define('text!withdrawl-form.html', ['module'], function(module) { module.exports = "<template>\n    <require from=\"./lib/crypto-format\"></require>\n    <h3>Funds Withdrawl</h3>\n\n    <div show.bind=\"loading\">\n        <span>Loading your account please wait...</span>\n        <i class=\"fa fa-spinner fa-spin\"></i>\n    </div>\n\n    <div show.bind=\"!loading && !success\">\n        <p>Your current balance:</p>\n        <table class=\"table table-striped table-bordered table-hover table-condensed\">\n            <thead>\n                <tr>\n                    <th></th>\n                    <th>Currency</th>\n                    <th>Balance</th>\n                </tr>\n            </thead>\n            <tbody>\n                <tr repeat.for=\"account of accounts\">\n                    <td>\n                        <label show.bind=\"!account.insufficientBalance\">\n                            <input type=\"checkbox\" value=\"\" checked.bind=\"account.checked\" change.delegate=\"accountChecked(account)\">\n                        </label>\n                    </td>\n                    <td>\n                        <span class=\"uppercase\">${account.currency}</span>\n                        <i class=\"currency-icon currency-${account.currency}\"></i>\n                    </td>\n                    <td>${account.balance}\n                        <i class=\"currency-icon currency-${account.currency}\" show.bind=\"account.balance>0\"></i>\n                    </td>\n                </tr>\n            </tbody>\n        </table>\n    </div>\n\n    <div class=\"row\" show.bind=\"!success && !loading && !insufficientBalance && accounts.length\">\n        <div class=\"col-lg-3\">\n            <div class=\"form-group\">\n                <label>Amount:</label>\n                <input type=\"text\" class=\"form-control\" placeholder=\"enter amt\" value.bind=\"withdrawlAmount\">\n            </div>\n        </div>\n        <div class=\"col-lg-9\">\n            <div class=\"form-group\">\n                <label>Receiving Address:</label>\n                <input type=\"text\" class=\"form-control\" placeholder=\"enter receiving address here\" value.bind=\"receivingAddress\">\n                <span show.bind=\"refundAddress && refundAddress == receivingAddress\" class=\"cash-out-receiving-address-info\">You\n                    have cashed out to this address ${refundAddressCount} time<span show.bind=\"refundAddressCount>1\">s</span>\n                    </label>\n            </div>\n        </div>\n    </div>\n\n    <div class=\"form-group\" id=\"cashing-out-info\" show.bind=\"cashingOutInfo\">\n        <div>${cashingOutInfo}</div>\n        <i class=\"fa fa-spinner fa-spin\" show.bind=\"inProgress\"></i>\n    </div>\n\n    <div class=\"alert alert-danger\" show.bind=\"!loading && errorMessage\">${errorMessage}</div>\n\n    <div id=\"cashOutSummary\" show.bind=\"success\">\n        <h4>Withdrawl Approved</h3>\n            <div class=\"alert alert-warning\">Your transaction will be pushed to the network in ~1 hour</div>\n            <table class=\"cash-out-summary-table\">\n                <tr>\n                    <td>Sent:</td>\n                    <td><span class=\"cashOutSummary-sent\">${amountSent | cryptoFormat:currency}</span>\n                        <i class=\"currency-icon currency-${currency}\"></i></td>\n                </tr>\n                <tr show.bind=\"txHashLink\">\n                    <td>Tx Hash:</td>\n                    <td>\n                        <span class=\"cashOutSummary-txHash\">\n                            <a href.bind=\"txHashLink\" target=\"_blank\">[View]</span>\n                        </span>\n                </tr>\n                <tr>\n                    <td>Your Balance:</td>\n                    <td>\n                        <span class=\"cashOutSummary-balance\">${balance | cryptoFormat:currency}</span>\n                        <i class=\"currency-icon currency-${currency}\"></i>\n                    </td>\n                </tr>\n            </table>\n\n    </div>\n\n    </div>\n\n    <div style=\"margin-top: 20px;\">\n        <span click.trigger=\"controller.cancel()\" id=\"cashOut-window-close\" class=\"options-btn\">Close</span>\n        <button click.trigger=\"withdraw()\" id=\"cashOut-window-withdraw\" class=\"options-btn red\" disabled.bind=\"inProgress\"\n            show.bind=\"!result && !loading && !insufficientBalance && accounts.length\">Confirm & Withdraw</button>\n    </div>\n</template>"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('user-settings',["require", "exports", "aurelia-framework", "aurelia-event-aggregator", "./lib/util", "./lib/api-service", "./shared/DataContainer", "./shared/ClientMessage", "./shared/login-request", "./messages"], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, util_1, api_service_1, DataContainer_1, ClientMessage_1, login_request_1, messages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var UserSettings = (function () {
        function UserSettings(util, ea, apiService) {
            var _this = this;
            this.util = util;
            this.ea = ea;
            this.apiService = apiService;
            this.subscriptions = [];
            this.loading = true;
            this.subscriptions.push(ea.subscribe(DataContainer_1.GetAccountSettingsResult, function (r) { return _this.handleAccountSettings(r); }));
            this.subscriptions.push(ea.subscribe(DataContainer_1.SetAccountSettingsResult, function (r) { return _this.handleSetAccountSettings(r); }));
        }
        UserSettings.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        UserSettings.prototype.attached = function () {
            var message = new ClientMessage_1.ClientMessage();
            message.getAccountSettingsRequest = new ClientMessage_1.GetAccountSettingsRequest();
            this.apiService.sendMessage(message);
        };
        UserSettings.prototype.handleAccountSettings = function (result) {
            this.result = result;
            this.loading = false;
        };
        UserSettings.prototype.save = function () {
            this.saving = true;
            var message = new ClientMessage_1.ClientMessage();
            message.setAccountSettingsRequest = new ClientMessage_1.SetAccountSettingsRequest();
            message.setAccountSettingsRequest.screenName = this.result.screenName;
            message.setAccountSettingsRequest.muteSounds = this.result.muteSounds;
            this.apiService.sendMessage(message);
        };
        Object.defineProperty(UserSettings.prototype, "saveButtonText", {
            get: function () {
                if (this.saving)
                    return 'Saving';
                else {
                    if (this.saveResult && this.saveResult.success) {
                        return 'Saved!';
                    }
                }
                return 'Save';
            },
            enumerable: true,
            configurable: true
        });
        UserSettings.prototype.handleSetAccountSettings = function (saveResult) {
            this.saveResult = saveResult;
            this.saving = false;
            if (saveResult.success) {
                this.util.user.screenName = this.result.screenName;
                this.util.user.muteSounds = this.result.muteSounds;
            }
            console.log('user', this.util.user);
        };
        UserSettings.prototype.handleLogoutResult = function (result) {
            this.saving = false;
        };
        UserSettings.prototype.logout = function () {
            this.saving = true;
            var message = new ClientMessage_1.ClientMessage();
            message.logoutRequest = new login_request_1.LogoutRequest();
            this.apiService.sendMessage(message);
        };
        UserSettings.prototype.loginClicked = function () {
            this.ea.publish(Object.assign(new messages_1.OpenLoginPopupEvent()));
        };
        UserSettings.prototype.registerClicked = function () {
            this.ea.publish(Object.assign(new messages_1.OpenLoginPopupEvent(true)));
        };
        __decorate([
            aurelia_framework_1.computedFrom('saving', 'saveResult'),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [])
        ], UserSettings.prototype, "saveButtonText", null);
        UserSettings = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [util_1.Util, aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService])
        ], UserSettings);
        return UserSettings;
    }());
    exports.UserSettings = UserSettings;
});



define('text!user-settings.html', ['module'], function(module) { module.exports = "<template>\n  <form>\n    <!--<div class=\"form-group\">\n      <label for=\"email\">Email address:</label>\n      <input type=\"email\" class=\"form-control\" id=\"email\">\n    </div>-->\n\n    <div class=\"form-group\" show.bind=\"loading\">\n      <span>Loading your account please wait...</span>\n      <i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i>\n    </div>\n\n    <div class=\"form-group\" show.bind=\"!apiService.authenticated\">\n      <div class=\"alert alert-warning\">\n        <p>You are not logged in! </p>\n        <p><a href=\"#\" click.delegate=\"loginClicked()\">Login </a> or <a href=\"#\" click.delegate=\"registerClicked()\">Register now!</a></p>\n      </div>            \n    </div>\n\n    <div class=\"form-group\" show.bind=\"!loading && apiService.authenticated\">\n        <label>Email</label>\n        <input type=\"text\" class=\"form-control\" value.bind=\"result.email\" disabled>\n      </div>\n\n    <div class=\"form-group\" css=\"visibility: ${loading ? 'hidden':'visible'}\">\n      <label>Screen Name</label>\n      <input type=\"text\" class=\"form-control\" value.bind=\"result.screenName\" disabled.bind=\"saving\">\n    </div>\n    \n    <div class=\"form-group\" css=\"visibility: ${loading ? 'hidden':'visible'}\">\n      <label>\n        <input type=\"checkbox\" value=\"\" checked.bind=\"result.muteSounds\" disabled.bind=\"saving\">Mute Sounds</label>\n    </div>\n    \n\n    <div class=\"alert alert-danger form-group\" show.bind=\"saveResult.errorMessage\">\n      ${saveResult.errorMessage}\n    </div>\n\n    <div class=\"form-group\">\n        <button click.trigger=\"save()\" disabled.bind=\"saving\" show.bind=\"!loading\" class=\"btn save-button\">${saveButtonText} <i class=\"fa fa-save\" show.bind=\"!saving\"> </i><i class=\"fa fa-refresh fa-spin\" show.bind=\"saving\"></i></button>      \n        <button show.bind=\"apiService.authenticated\" style=\"float: right;\" click.trigger=\"logout()\" disabled.bind=\"saving\" show.bind=\"!loading\" class=\"btn btn-danger\">Logout <i class=\"fa fa-sign-out\"></i></button>\n      \n    </div>\n  </form>\n\n\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('transfer-funds',["require", "exports", "aurelia-framework", "aurelia-dialog", "aurelia-event-aggregator", "./lib/util", "./lib/api-service", "./shared/DataContainer", "./shared/Currency", "./shared/ClientMessage"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, aurelia_event_aggregator_1, util_1, api_service_1, DataContainer_1, Currency_1, ClientMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TransferFunds = (function () {
        function TransferFunds(controller, util, ea, apiService) {
            var _this = this;
            this.controller = controller;
            this.util = util;
            this.ea = ea;
            this.apiService = apiService;
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.TransferFundsResult, function (r) { return _this.handleTransferFundsResult(r); }));
        }
        TransferFunds.prototype.handleTransferFundsResult = function (result) {
            this.result = result;
            this.saving = false;
            if (result.success)
                this.successMessage = result.amount / Currency_1.CurrencyUnit.default + " " + result.currency + " has been transferred to " + result.screenName;
        };
        TransferFunds.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        Object.defineProperty(TransferFunds.prototype, "transferButtonText", {
            get: function () {
                if (this.saving)
                    return 'Transferring...';
                else {
                    if (this.result && this.result.success) {
                        return 'Transferred!';
                    }
                }
                return 'Transfer Now';
            },
            enumerable: true,
            configurable: true
        });
        TransferFunds.prototype.transfer = function () {
            this.saving = true;
            var message = new ClientMessage_1.ClientMessage();
            message.transferFundsRequest = new ClientMessage_1.TransferFundsRequest();
            message.transferFundsRequest.screenName = this.transferToScreenName;
            message.transferFundsRequest.amount = Math.round(this.transferAmount * Currency_1.CurrencyUnit.default);
            this.apiService.sendMessage(message);
        };
        __decorate([
            aurelia_framework_1.computedFrom('saving', 'result'),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [])
        ], TransferFunds.prototype, "transferButtonText", null);
        TransferFunds = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, util_1.Util, aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService])
        ], TransferFunds);
        return TransferFunds;
    }());
    exports.TransferFunds = TransferFunds;
});



define('text!transfer-funds.html', ['module'], function(module) { module.exports = "<template>\n  <form>\n    \n      <div class=\"alert alert-warning\">          \n          <h4 class=\"alert-heading\">Please note!</h4>\n          <p class=\"mb-0\">This feature is only enabled for DASH <span class=\"currency-icon currency-dash\"></span></p>\n        </div>\n\n    <div class=\"form-group\">\n      <label>Transfer To</label>\n      <input type=\"text\" class=\"form-control\" value.bind=\"transferToScreenName\" disabled.bind=\"saving || result.success\" placeholder=\"enter screen name of user\">\n    </div>\n    \n    <div class=\"form-group\">\n      <label>Amount (in DASH)</label>\n      <input type=\"text\" class=\"form-control\" value.bind=\"transferAmount\" disabled.bind=\"saving || result.success\" placeholder=\"enter amount\">\n    </div>\n\n    <div class=\"alert alert-danger form-group\" show.bind=\"result.errorMessage\">${result.errorMessage}</div>\n    <div class=\"alert alert-success form-group\" show.bind=\"successMessage\">${successMessage}</div>\n\n    <div class=\"form-group\">\n      <button click.trigger=\"transfer()\" disabled.bind=\"saving || result.success\" class=\"btn save-button\">${transferButtonText} \n      <i class=\"fa fa-refresh fa-spin\" show.bind=\"saving\"></i></button>\n    </div>\n  </form>\n\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('tournament-result-poup',["require", "exports", "aurelia-framework", "aurelia-dialog", "./lib/util", "./lib/api-service", "./shared/ClientMessage", "./shared/CommonHelpers"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, util_1, api_service_1, ClientMessage_1, CommonHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentResultPopup = (function () {
        function TournamentResultPopup(controller, util, apiService) {
            this.controller = controller;
            this.util = util;
            this.apiService = apiService;
        }
        TournamentResultPopup.prototype.activate = function (view) {
            this.view = view;
            this.placingSuffix = CommonHelpers_1.ordinal_suffix_of(view.placing);
        };
        TournamentResultPopup.prototype.rebuy = function () {
            this.apiService.send(new ClientMessage_1.RebuyRequest(this.view.tournamentId));
            this.controller.ok();
        };
        TournamentResultPopup = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, util_1.Util, api_service_1.ApiService])
        ], TournamentResultPopup);
        return TournamentResultPopup;
    }());
    exports.TournamentResultPopup = TournamentResultPopup;
});



define('text!tournament-result-poup.html', ['module'], function(module) { module.exports = "<template>\n  <ux-dialog>    \n    <ux-dialog-body>\n      <h3>${view.tournamentName} <i class=\"fa fa-trophy\" aria-hidden=\"true\"></i></h3>\n      \n      <p class=\"alert alert-success\">\n        You finished the tournament in ${placingSuffix} place\n      </p>\n\n      <div show.bind=\"view.rebuyAmount\">\n      \n        <div show.bind=\"view.canRebuy\">\n          <p>Do you want to Rebuy? Rebuys are added to the prize total.</p>\n      \n          <button click.trigger=\"rebuy()\" class=\"btn btn-info\">Rebuy ${view.rebuyAmount} <span class=\"uppercase\">${view.currency}</span>\n            <i class=\"currency-icon currency-${view.currency}\"></i></button>\n        </div>\n      \n        <div class=\"alert alert-danger\" show.bind=\"!view.canRebuy\">\n          <p>Rebuy is available but you do not have sufficient funds!</p>\n          <p>The rebuy is ${view.rebuyAmount} <span class=\"uppercase\">${view.currency}</span>\n            <i class=\"currency-icon currency-${view.currency}\"></i>\n        \n            <!-- <button click.trigger=\"openDepositWindow()\" class=\"btn btn-info\" show.bind=\"!view.isFunded\">Deposit Now!<i class=\"fa fa-money\"></i></button>             -->\n          </p>\n        </div>\n      \n      </div>\n      \n    </ux-dialog-body>\n    <ux-dialog-footer>\n      <button click.trigger=\"controller.ok()\">Ok</button>\n    </ux-dialog-footer>\n  </ux-dialog>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('tournament-info-poup',["require", "exports", "aurelia-framework", "aurelia-dialog", "./lib/util", "./lib/api-service", "./shared/TournamentInfoRequest", "aurelia-event-aggregator", "./shared/decimal", "./shared/CommonHelpers"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, util_1, api_service_1, TournamentInfoRequest_1, aurelia_event_aggregator_1, decimal_1, CommonHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentInfoPopup = (function () {
        function TournamentInfoPopup(ea, controller, apiService, util) {
            var _this = this;
            this.ea = ea;
            this.controller = controller;
            this.apiService = apiService;
            this.util = util;
            this.subscriptions = [];
            this.loading = true;
            this.prizes = [];
            this.subscriptions.push(ea.subscribe(TournamentInfoRequest_1.TournamentInfoResult, function (r) { return _this.handleTournamentInfoResult(r); }));
        }
        TournamentInfoPopup.prototype.handleTournamentInfoResult = function (result) {
            this.loading = false;
            this.view = result;
            this.name = result.name;
            var i = 0;
            var total = new decimal_1.Decimal(0);
            for (var _i = 0, _a = result.prizes; _i < _a.length; _i++) {
                var prize = _a[_i];
                this.prizes.push({ placing: CommonHelpers_1.ordinal_suffix_of(i + 1), prize: new decimal_1.Decimal(prize).toFixed(this.getNumDecimalPlaces(result.currency)) });
                i++;
                total = total.add(new decimal_1.Decimal(prize));
            }
            this.totalPrize = total.toString();
        };
        TournamentInfoPopup.prototype.getNumDecimalPlaces = function (currency) {
            if (currency === 'chp') {
                return 0;
            }
            return 3;
        };
        TournamentInfoPopup.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        TournamentInfoPopup.prototype.activate = function (model) {
            this.name = model.name;
            this.apiService.send(new TournamentInfoRequest_1.TournamentInfoRequest(model.id));
        };
        TournamentInfoPopup = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, aurelia_dialog_1.DialogController, api_service_1.ApiService, util_1.Util])
        ], TournamentInfoPopup);
        return TournamentInfoPopup;
    }());
    exports.TournamentInfoPopup = TournamentInfoPopup;
});



define('text!tournament-info-poup.html', ['module'], function(module) { module.exports = "<template>\n  <ux-dialog>    \n    <ux-dialog-body>\n      <div style=\"max-height:600px;overflow: auto;overflow-x: hidden;\">\n          <div>\n              <i click.trigger=\"controller.ok()\" class=\"fa fa-window-close\" style=\"float:right; margin-right: 10px;\"></i>  \n            <h3>${name} <i class=\"fa fa-trophy\" aria-hidden=\"true\"></i></h3>\n              \n          </div>\n      \n          <p show.bind=\"loading\"><i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i></p>\n    \n          <div show.bind=\"!loading\">\n            <div class=\"row\">\n              <div class=\"col-lg-12\">\n                <ul>\n                  <li>Currency: <span class=\"uppercase\">${view.currency}</span> <i class=\"currency-icon currency-${view.currency}\"></i></li>\n                  <li>Buy in: <span show.bind=\"view.buyIn\">${view.buyIn}</span> <span show.bind=\"!view.buyIn\">${view.buyIn}Free</span> </li>\n                  <li>Players per table: ${view.playersPerTable}</li>\n                  <li>Starting Chips: ${view.startingChips}</li>\n                  <li>Time to Act: ${view.timeToActSec} seconds</li>\n                  <li>Late Registration: ${view.lateRegistrationMin} minutes</li>\n                  <li>Evict after Idle: ${view.evictAfterIdleMin} minutes</li>\n                </ul>\n              </div>\n            </div>\n            <div class=\"row\">\n              \n              <div class=\"col-lg-6\">\n                  <h4>Prizes - ${totalPrize} <span class=\"uppercase\">${view.currency}</span> <i class=\"currency-icon currency-${view.currency}\"></i></h4>\n                \n                <table class=\"table table-striped table-bordered table-hover table-condensed\">\n                  <thead>\n                    <tr>\n                      <th>#</th>\n                      <th>Prize</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    <tr repeat.for=\"prize of prizes\">\n                      <td>${prize.placing}</td>\n                      <td>${prize.prize} <span class=\"uppercase\">${view.currency}</span> <i class=\"currency-icon currency-${view.currency}\"></i></td>                  \n                    </tr>\n                  </tbody>\n                </table>\n\n                \n    \n                <h4>Blinds</h4>\n                  <table class=\"table table-striped table-bordered table-hover table-condensed\">\n                      <thead>\n                        <tr>\n                          <th>Small</th>\n                          <th>Big</th>\n                          <th>Time</th>\n                        </tr>\n                      </thead>\n                      <tbody>\n                        <tr repeat.for=\"i of view.blindConfig.length\">\n                          <td><span>${$parent.view.blindConfig[i].smallBlind}</span></td>\n                          <td><span>${$parent.view.blindConfig[i].bigBlind}</span></td>\n                          <td><span>${$parent.view.blindConfig[i].timeMin} min</span></td>\n                          \n                        </tr>\n                      </tbody>\n                    </table>\n               \n    \n              </div>\n              \n              <div class=\"col-lg-5\">\n                <h4>Results</h4>\n                \n                <table class=\"table table-striped table-bordered table-hover table-condensed\">\n                  <thead>\n                    <tr>\n                      <th>#</th>\n                      <th>User</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    <tr repeat.for=\"result of view.results\">\n                      <td>${result.placing}</td>\n                      <td>${result.screenName} <span show.bind=\"result.stack\" style=\"float:right;\">${result.stack}</span></td>                  \n                    </tr>\n                  </tbody>\n                </table>\n                <p show.bind=\"!view.results.length\">Results will be shown here when the tournament is running</p>\n              </div>\n              \n              \n              \n            </div>\n           \n          </div>\n      </div>\n      \n    </ux-dialog-body>\n    <!-- <ux-dialog-footer>\n      <button click.trigger=\"controller.ok()\">Ok</button>\n    </ux-dialog-footer> -->\n  </ux-dialog>\n</template>\n"; });
define('text!style.css', ['module'], function(module) { module.exports = "body {\n  font-family: 'Roboto Condensed', sans-serif;\n  padding-top: 50px; }\n\n.navbar-default {\n  background-color: lightcyan; }\n\n.nav-logo {\n  background: url(\"images/logo.png\") no-repeat;\n  width: 340px;\n  height: 50px;\n  margin-top: -12px;\n  display: inline-block; }\n\n.container-fluid {\n  background-color: #E8E8E8;\n  padding-bottom: 55px; }\n\n.header-nav {\n  text-align: center;\n  margin-bottom: 20px; }\n\n.header-nav span {\n  margin-left: 100px; }\n\n.navbar-nav > li > span {\n  padding-top: 17px;\n  padding-bottom: 13px; }\n\n#poker-room {\n  height: 600px;\n  width: 800px;\n  margin: auto;\n  margin-top: 10px;\n  margin-bottom: 30px;\n  position: relative;\n  overflow: hidden;\n  display: inline-block;\n  vertical-align: top;\n  border: 2px solid gray; }\n\n.poker-tables-container {\n  margin: auto;\n  margin-top: 5px; }\n\n@media (min-width: 1230px) {\n  #poker-room {\n    display: inline-block; }\n  .poker-tables-container {\n    display: inline-block;\n    margin-left: 20px; } }\n\n@media (min-width: 1550px) {\n  #leaderboard-lhs {\n    display: inline-block;\n    vertical-align: top;\n    margin-right: 10px; } }\n\n#loadingTable {\n  position: absolute;\n  left: 300px;\n  top: 200px;\n  width: 200px;\n  margin: auto;\n  color: #fff;\n  text-align: center;\n  padding: 20px;\n  border-radius: 5px;\n  background-color: rgba(0, 0, 0, 0.5); }\n\n#newGameStartingIn {\n  position: absolute;\n  left: 300px;\n  top: 112px;\n  width: 200px;\n  margin: auto;\n  background-color: gray;\n  text-align: center;\n  padding: 8px;\n  border-radius: 5px;\n  opacity: 0.5;\n  color: white; }\n\n.cashOut {\n  position: absolute;\n  right: 20px;\n  top: 10px;\n  padding: 10px;\n  background-color: white;\n  border-radius: 5px;\n  cursor: pointer;\n  border: 1px solid black;\n  font-weight: bold; }\n\n.cashOut:hover {\n  background-color: red; }\n\n.pingTime {\n  position: absolute;\n  right: 0px;\n  bottom: 0px;\n  color: #fff;\n  font-size: 0.70em; }\n\n.connected-icon {\n  color: darkgreen; }\n\n.disconnected-icon {\n  color: red; }\n\n.current-table-name {\n  margin-left: 8px;\n  color: #fff; }\n\n.current-table-name .nextBlinds {\n  font-size: 0.8em; }\n\n.invitation {\n  line-height: 80px;\n  color: #000;\n  font-size: 18px;\n  color: white;\n  text-align: center; }\n\n.can-sit:hover {\n  background-color: #37FF00;\n  cursor: pointer; }\n\n.can-sit:hover .invitation {\n  visibility: visible;\n  color: black; }\n\n.down0 {\n  position: absolute;\n  top: 35px;\n  left: 5px; }\n\n.down1 {\n  position: absolute;\n  top: 35px;\n  left: 20px; }\n\n.player-seat-info-box {\n  position: absolute;\n  background-color: #000;\n  opacity: 0.7;\n  width: 100%;\n  text-align: center;\n  font-size: 12px;\n  line-height: 1.2; }\n\n.player-status {\n  height: 35px;\n  top: 45px; }\n\n.player-own-stack {\n  height: 12px;\n  top: 0px; }\n\n.player-amount {\n  font-weight: bold; }\n\n.chip-edge {\n  background-image: url(\"images/chip-edge.png\");\n  width: 12px;\n  height: 2px;\n  min-width: 12px;\n  min-height: 2px;\n  position: absolute;\n  top: 65px; }\n\n.edge-1 {\n  background-color: #ff0000;\n  left: 363px; }\n\n.edge-2 {\n  background-color: #007c00;\n  left: 379px; }\n\n.edge-3 {\n  background-color: #0000ff;\n  left: 395px; }\n\n.edge-4 {\n  background-color: #551255;\n  left: 411px; }\n\n.edge-5 {\n  background-color: #ffff00;\n  left: 426px; }\n\n.chip-spot {\n  width: 2px;\n  height: 2px;\n  min-width: 2px;\n  min-height: 2px;\n  background-color: #d9d9d9;\n  position: absolute;\n  top: 0px; }\n\n.boardcard {\n  width: 70px;\n  height: 98px;\n  position: absolute; }\n\n.boardcard > div {\n  width: 70px;\n  height: 98px; }\n\n#card-0 {\n  left: 211px;\n  top: 157px; }\n\n#card-1 {\n  left: 288px;\n  top: 157px; }\n\n#card-2 {\n  left: 365px;\n  top: 157px; }\n\n#card-3 {\n  left: 442px;\n  top: 157px; }\n\n#card-4 {\n  left: 519px;\n  top: 157px; }\n\n.faceup {\n  position: absolute; }\n\n.btn {\n  border: 1px solid #7eb9d0;\n  -webkit-border-radius: 3px;\n  -moz-border-radius: 3px;\n  border-radius: 3px;\n  font-size: 12px;\n  text-decoration: none;\n  display: inline-block;\n  color: #FFFFFF;\n  background-color: #a7cfdf;\n  background-image: -webkit-gradient(linear, left top, left bottom, from(#a7cfdf), to(#23538a));\n  background-image: -webkit-linear-gradient(top, #a7cfdf, #23538a);\n  background-image: -moz-linear-gradient(top, #a7cfdf, #23538a);\n  background-image: -ms-linear-gradient(top, #a7cfdf, #23538a);\n  background-image: -o-linear-gradient(top, #a7cfdf, #23538a);\n  background-image: linear-gradient(to bottom, #a7cfdf, #23538a);\n  filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=#a7cfdf, endColorstr=#23538a); }\n\n.btn:hover {\n  border: 1px solid #5ca6c4;\n  background-color: #82bbd1;\n  background-image: -webkit-gradient(linear, left top, left bottom, from(#82bbd1), to(#193b61));\n  background-image: -webkit-linear-gradient(top, #82bbd1, #193b61);\n  background-image: -moz-linear-gradient(top, #82bbd1, #193b61);\n  background-image: -ms-linear-gradient(top, #82bbd1, #193b61);\n  background-image: -o-linear-gradient(top, #82bbd1, #193b61);\n  background-image: linear-gradient(to bottom, #82bbd1, #193b61);\n  filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=#82bbd1, endColorstr=#193b61);\n  cursor: pointer; }\n\n.bet-action-button {\n  color: #ffffff;\n  font-size: 18px;\n  text-decoration: none;\n  text-align: center;\n  min-width: 100px;\n  min-height: 50px; }\n\n#betting-shortcuts {\n  position: absolute;\n  top: 462px;\n  left: 420px; }\n\n#betting-shortcuts span {\n  color: #ffffff;\n  padding: 3px 6px; }\n\n#fold {\n  position: absolute;\n  top: 528px;\n  left: 420px; }\n\n#check {\n  position: absolute;\n  top: 528px;\n  left: 540px; }\n\n.action-button-info {\n  color: white;\n  font-size: 0.55em;\n  padding-top: 3px;\n  line-height: 4px; }\n\n#bet {\n  position: absolute;\n  top: 528px;\n  left: 660px; }\n\n#leaveTable {\n  position: absolute;\n  top: 404px;\n  left: 16px; }\n\n#sitOutNextHandContainer {\n  position: absolute;\n  top: 420px;\n  left: 15px;\n  color: #fff; }\n\n#label1 {\n  top: 4.2px;\n  left: 9px; }\n\n#label2 {\n  top: 23px;\n  left: 9px; }\n\n#label3 {\n  top: 42px;\n  left: 9px; }\n\n#bet_slider {\n  position: absolute;\n  top: 496px;\n  left: 568px; }\n\n#bet_slider .tooltip .tooltip-inner {\n  display: none; }\n\n#bet_slider .tooltip-arrow {\n  display: none; }\n\n#bet-amount {\n  position: absolute;\n  top: 466px;\n  left: 711px;\n  width: 65px;\n  text-align: right;\n  font-weight: bold; }\n\n.dealerbutton {\n  background: radial-gradient(#fff, gray);\n  width: 16px;\n  height: 16px;\n  -moz-border-radius: 50%;\n  -webkit-border-radius: 50%;\n  border-radius: 50%;\n  border-color: #222;\n  position: absolute;\n  font-size: 11px;\n  color: black;\n  text-align: center;\n  vertical-align: middle;\n  line-height: 16px;\n  font-size: 10px;\n  border: 1px solid gray;\n  -webkit-font-smoothing: antialiased; }\n\n.chip {\n  width: 15px;\n  height: 15px;\n  -moz-border-radius: 50%;\n  -webkit-border-radius: 50%;\n  border-radius: 50%;\n  /* background: #0000ff; */\n  background-image: url(\"images/chip.png\");\n  background-position: center;\n  background-repeat: no-repeat;\n  -webkit-box-shadow: 0px 1px 2px 0px black;\n  -moz-box-shadow: 0px 1px 2px 0px black;\n  box-shadow: 0px 1px 2px 0px black;\n  position: absolute; }\n\n.chip1 {\n  background-color: #3357A5; }\n\n/* .chip2 {background-color:;} */\n/* .chip3 {background-color:#007c00;} */\n/* .chip4 {background-color:#551255;} */\n.chip5 {\n  background-color: #ff0000; }\n\n.chip10 {\n  background-color: #0000ff; }\n\n.chip20 {\n  background-color: #7E7E7E; }\n\n.chip25 {\n  background-color: #007c00; }\n\n.chip50 {\n  background-color: #FF9100; }\n\n.chip100 {\n  background-color: #760000; }\n\n.chip250 {\n  background-color: #FF468C; }\n\n.chip500 {\n  background-color: #551255; }\n\n.chip1000 {\n  background-color: #76E400; }\n\n.chip2000 {\n  background-color: #00B1D0; }\n\n.chip5000 {\n  background-color: #B85400; }\n\n.chip10000 {\n  background-color: #EF08FF; }\n\n#testchip {\n  position: absolute;\n  top: 300px;\n  left: 300px; }\n\n#testchip2 {\n  position: absolute;\n  top: 298px;\n  left: 300px; }\n\n#testchip3 {\n  position: absolute;\n  top: 296px;\n  left: 300px; }\n\n#infobox {\n  background: #000;\n  opacity: 0.85;\n  height: 145px;\n  width: 360px;\n  position: absolute;\n  top: 450px;\n  left: 10px;\n  border-style: solid;\n  border-width: 2px;\n  border-color: #fff;\n  overflow: hidden; }\n\n#gameinfo {\n  text-align: left;\n  border-bottom: 1px solid white;\n  height: 30px;\n  line-height: 30px;\n  padding-left: 20px;\n  background-color: lightcyan; }\n\n#chatbox {\n  height: 85px;\n  width: 355px;\n  position: absolute;\n  top: 33px;\n  padding-left: 4px;\n  color: #fff;\n  line-height: 14px;\n  font-size: 12px;\n  overflow-y: auto;\n  padding-bottom: 3px;\n  padding-right: 20px;\n  overflow-wrap: break-word; }\n\n#poker-room-chat-volume {\n  height: 16px;\n  width: 16px;\n  position: absolute;\n  top: 33px;\n  right: 16px;\n  color: white;\n  cursor: pointer; }\n\n#chat-input {\n  height: 21px;\n  width: 360px;\n  position: absolute;\n  top: 117px;\n  /* background:#0000ff; */ }\n\n#chat-input input[type=text] {\n  width: 320px; }\n\n#submitchat {\n  width: 34px;\n  height: 18px;\n  position: absolute;\n  top: 2px;\n  left: 321px;\n  -webkit-border-radius: 3px;\n  -moz-border-radius: 3px;\n  border-radius: 3px;\n  background: #fff;\n  text-align: center;\n  line-height: 20px;\n  color: #000; }\n\n#submitchat:hover {\n  cursor: pointer; }\n\n#settings {\n  width: 28px;\n  height: 20px;\n  position: absolute;\n  top: 0px;\n  left: 329px;\n  -webkit-border-radius: 3px;\n  -moz-border-radius: 3px;\n  border-radius: 3px;\n  background: #fff;\n  text-align: center;\n  line-height: 20px;\n  color: #000; }\n\n#settings:hover {\n  cursor: pointer; }\n\n#pot-amount {\n  position: absolute;\n  left: 340px;\n  top: 20px;\n  min-width: 120px;\n  height: 25px;\n  background: #ff0000;\n  text-align: center;\n  color: #fff;\n  font-weight: bold;\n  border: 2px solid white;\n  border-radius: 5px;\n  background: #000;\n  opacity: 0.7; }\n\n#table-pot-amount {\n  position: absolute;\n  left: 416px;\n  top: 266px;\n  color: white;\n  padding: 1px 3px;\n  background-color: #737373;\n  border-radius: 5px; }\n\n.stack-label {\n  text-align: center;\n  width: 110px;\n  position: absolute;\n  z-index: 2; }\n\n.stack-label span {\n  color: white;\n  padding: 1px 3px;\n  font-size: 12px;\n  background-color: #737373;\n  border-radius: 5px; }\n\n.hide {\n  visibility: hidden; }\n\n.action {\n  position: absolute;\n  top: 0px;\n  width: 110px;\n  background-color: #000;\n  z-index: 5;\n  text-align: center;\n  font-size: 0.8em; }\n\n#player-total {\n  position: absolute;\n  width: 140px;\n  text-align: right;\n  left: 0;\n  font-weight: bold; }\n\n#tocall {\n  position: absolute;\n  width: 140px;\n  left: 160px;\n  text-align: left; }\n\n#seat0button {\n  top: 105px;\n  left: 607px; }\n\n#seat1button {\n  top: 197px;\n  left: 670px; }\n\n#seat2button {\n  top: 247px;\n  left: 670px; }\n\n#seat3button {\n  top: 332px;\n  left: 525px; }\n\n#seat4button {\n  top: 344px;\n  left: 338px; }\n\n#seat5button {\n  top: 342px;\n  left: 265px; }\n\n#seat6button {\n  top: 249px;\n  left: 120px; }\n\n#seat7button {\n  top: 197px;\n  left: 120px; }\n\n#seat8button {\n  top: 105px;\n  left: 183px; }\n\n.potchip {\n  z-index: 5; }\n\n#side-pots {\n  position: absolute;\n  left: 660px;\n  top: 5px;\n  width: 160px;\n  height: 80px;\n  background: #ff0000;\n  line-height: 25px;\n  /* text-align:center; */\n  color: #fff;\n  font-size: 12px;\n  line-height: 14px;\n  padding-left: 15px;\n  padding-top: 5px;\n  border-style: solid;\n  border-width: 2px;\n  border-radius: 25px;\n  border-color: #fff;\n  background: #000;\n  opacity: 0.7;\n  overflow-y: scroll; }\n\n#side-pots ol {\n  margin-top: 3px;\n  padding-left: 23px; }\n\n#gametype {\n  margin: 3px 5px;\n  color: #fff;\n  line-height: 14px;\n  font-size: 12px; }\n\n.show {\n  visibility: visible; }\n\n#join-label {\n  text-align: center;\n  position: absolute;\n  top: 475px;\n  left: 450px;\n  color: #fff;\n  font-size: 14px;\n  background-color: #000;\n  padding: 10px 20px;\n  border-style: solid;\n  border-width: 2px;\n  border-radius: 10px;\n  max-height: 100px;\n  overflow: auto; }\n\n#auto-controls {\n  position: absolute;\n  top: 420px;\n  right: 30px; }\n\n#fold-any-bet {\n  color: #fff; }\n\n#auto-check-conatiner {\n  color: #fff; }\n\n.multi-pot-result {\n  font-size: 12px; }\n\n#poker-room {\n  background-image: url(\"images/bg-green.png\");\n  background-position: center;\n  background-repeat: no-repeat;\n  background-position: 50% 50%; }\n\n.player-info {\n  height: 80px;\n  width: 105px;\n  min-width: 105px;\n  min-height: 80px;\n  overflow: hidden;\n  border-radius: 15px;\n  border-color: #bcbcbc;\n  position: absolute;\n  -webkit-box-shadow: -4px 6px 32px -6px rgba(0, 0, 0, 0.75);\n  -moz-box-shadow: -4px 6px 32px -6px rgba(0, 0, 0, 0.75);\n  box-shadow: -4px 6px 32px -6px rgba(0, 0, 0, 0.75);\n  z-index: 2;\n  color: #fff; }\n\n.player-sitting {\n  border: 2px solid #bcbcbc; }\n\n.grayscale {\n  -webkit-filter: grayscale(100%);\n  /* Safari 6.0 - 9.0 */\n  filter: grayscale(100%);\n  color: grey;\n  font-style: italic; }\n\n.player-sitting-inner:before {\n  content: \"\";\n  position: relative;\n  left: 0;\n  right: 0;\n  z-index: -1;\n  display: block;\n  background: url(\"images/default-user.png\") #616f91 no-repeat;\n  height: 80px;\n  width: 105px; }\n\n.player-sitting-inner-grayscale:before {\n  -webkit-filter: grayscale(100%);\n  -moz-filter: grayscale(100%);\n  -o-filter: grayscale(100%);\n  -ms-filter: grayscale(100%);\n  filter: grayscale(100%); }\n\n.player-my-turn {\n  border-color: #fff; }\n\n#seat-0 {\n  top: 18.8259221535px;\n  left: 513.524208699px; }\n\n#seat-1 {\n  top: 111.422367183px;\n  left: 664.600452377px; }\n\n#seat-2 {\n  top: 268.577632817px;\n  left: 664.600452377px; }\n\n#seat-3 {\n  top: 351.867615095px;\n  left: 534.50174937px; }\n\n#seat-4 {\n  top: 363.867615095px;\n  left: 347.5px; }\n\n#seat-5 {\n  top: 351.867615095px;\n  left: 160.49825063px; }\n\n#seat-6 {\n  top: 268.577632817px;\n  left: 30.3995476231px; }\n\n#seat-7 {\n  top: 111.422367183px;\n  left: 30.3995476231px; }\n\n#seat-8 {\n  top: 18.8259221535px;\n  left: 181.475791301px; }\n\n.faceup > img {\n  width: 150px; }\n\n.card0 {\n  top: 12px;\n  left: 15px; }\n\n.card1 {\n  top: 25px;\n  left: 40px; }\n\n#stack0 {\n  top: 121px;\n  left: 440px; }\n\n#stack1 {\n  top: 158px;\n  left: 558px; }\n\n#stack2 {\n  top: 260px;\n  left: 556px; }\n\n#stack3 {\n  top: 300px;\n  left: 534px; }\n\n#stack4 {\n  top: 312px;\n  left: 347.5px; }\n\n#stack5 {\n  top: 300px;\n  left: 180px; }\n\n#stack6 {\n  top: 265px;\n  left: 139px; }\n\n#stack7 {\n  top: 160px;\n  left: 110px; }\n\n#stack8 {\n  top: 125px;\n  left: 255px; }\n\n.popup-window {\n  position: absolute;\n  top: 70px;\n  left: 150px;\n  background: #e4e4e4;\n  border-width: 5px;\n  border-style: solid;\n  border-color: #737373;\n  z-index: 50;\n  padding-top: 8px; }\n\n#options-window {\n  width: 200px;\n  min-height: 420px; }\n\n#funding-window, #cashOut-window {\n  padding: 20px;\n  width: 500px; }\n\n#join-amount-slider-container .tooltip {\n  display: none; }\n\n#cashOut-window-withdraw {\n  background-color: red;\n  color: white;\n  float: right; }\n\nbutton:disabled {\n  color: darkslategray;\n  background-color: lightgray;\n  font-weight: normal;\n  cursor: auto; }\n\ninput:disabled {\n  background-color: lightgray; }\n\n#cashOutSummary h4 {\n  background-color: gray;\n  color: white;\n  padding: 10px; }\n\n.options-btn {\n  display: inline-block;\n  line-height: 22px;\n  font-size: 18px;\n  color: #ffffff;\n  text-align: center;\n  background: #737373;\n  padding: 8px;\n  border-style: solid;\n  border-color: #000;\n  border-width: 1px; }\n\n.options-btn:hover {\n  background: #000;\n  cursor: pointer; }\n\n#options-cancel {\n  width: 40%; }\n\n#options-confirm {\n  width: 40%; }\n\n#disconnect {\n  position: absolute;\n  left: 20px;\n  top: 300px;\n  height: 22px;\n  width: 160px;\n  line-height: 22px;\n  font-size: 14px;\n  color: #ffffff;\n  text-align: center;\n  background: #3930BE;\n  -webkit-border-radius: 6;\n  -moz-border-radius: 6;\n  border-radius: 6px;\n  border-style: solid;\n  border-color: #000;\n  border-width: 1px; }\n\n#disconnect:hover {\n  background: #ff0000;\n  cursor: pointer; }\n\n#disconnect-window {\n  position: absolute;\n  top: 20;\n  left: -5px;\n  width: 200px;\n  min-height: 100px;\n  background: #e4e4e4;\n  border-width: 5px;\n  border-style: solid;\n  border-color: #ff0000;\n  z-index: 50;\n  padding-top: 8px; }\n\n#disconnect-cancel {\n  position: absolute;\n  left: 13px;\n  top: 70px; }\n\n#disconnect-confirm {\n  position: absolute;\n  left: 107px;\n  top: 70px; }\n\n.custom-bet-btn {\n  height: 22px;\n  width: 60px;\n  line-height: 22px;\n  font-size: 14px;\n  color: #ffffff;\n  text-align: center;\n  background: #3930BE;\n  -webkit-border-radius: 6;\n  -moz-border-radius: 6;\n  border-radius: 6px;\n  border-style: solid;\n  border-color: #000;\n  border-width: 1px; }\n\n.custom-bet-btn:hover {\n  background: #DE2D3F;\n  cursor: pointer; }\n\n#custom-bet-1 {\n  position: absolute;\n  top: 465px;\n  left: 338px; }\n\n#custom-bet-2 {\n  position: absolute;\n  top: 495px;\n  left: 338px; }\n\n#custom-bet-3 {\n  position: absolute;\n  top: 525px;\n  left: 338px; }\n\n#custom-bet-4 {\n  position: absolute;\n  top: 555px;\n  left: 338px; }\n\n#options-container {\n  overflow-y: scroll; }\n\n.waiting-on-payment {\n  padding: 10px;\n  border: 1px solid black;\n  -webkit-transition: backgroundColor 0.05s ease-in-out;\n  -ms-transition: backgroundColor 0.05s ease-in-out;\n  transition: backgroundColor 0.05s ease-in-out; }\n\n.yellow-bg {\n  background-color: yellow; }\n\ntable.poker-tables {\n  font-size: 12px;\n  border-collapse: collapse;\n  border-spacing: 0;\n  width: 100%; }\n\n.poker-tables td, .poker-tables th {\n  border: 1px solid gray;\n  text-align: left;\n  padding: 4px; }\n\n.poker-tables tr:nth-child(even) {\n  background-color: #f2f2f2; }\n\n.poker-tables th {\n  padding-top: 11px;\n  padding-bottom: 11px;\n  background-color: lightcyan; }\n\n.poker-tables tr:hover {\n  background-color: lightgray;\n  cursor: pointer; }\n\ntable.leaderboard {\n  font-size: 12px;\n  border-collapse: collapse;\n  border-spacing: 0;\n  width: 100%; }\n\n.leaderboard th {\n  background-color: lightcyan; }\n\n.leaderboard td, .leaderboard th {\n  border: 1px solid gray;\n  text-align: left;\n  padding: 4px; }\n\n.leaderboard-profit-positive {\n  color: green; }\n\n.leaderboard-profit-negative {\n  color: red; }\n\n.subscribedTo {\n  background-color: lightgoldenrodyellow !important; }\n\n.timer {\n  position: absolute !important;\n  top: 6px;\n  right: 5px;\n  border-radius: 50%;\n  border: 2px solid white;\n  padding: 2px;\n  z-index: 1000;\n  background-color: black;\n  min-width: 25px;\n  min-height: 25px;\n  text-align: center; }\n\n.chatRow {\n  margin: 0; }\n\n.chatScreenName {\n  color: red;\n  font-weight: bold; }\n\n.chatDealer {\n  color: aqua;\n  font-weight: bold; }\n\n.chatMessage {\n  color: #fff; }\n\nux-dialog-overlay.active {\n  background-color: black;\n  opacity: .5; }\n\nux-dialog {\n  width: 600px; }\n\n.empty-seat {\n  background: none #3c3d3d;\n  opacity: 0.5;\n  display: block; }\n\n.panel-footer-ex {\n  font-size: 0.7em;\n  text-align: center;\n  height: 45px;\n  position: relative; }\n\n.footer-content {\n  position: absolute;\n  bottom: 0px;\n  margin-left: auto;\n  margin-right: auto;\n  left: 0;\n  right: 0; }\n\n.crypto-balance {\n  margin-left: 30px; }\n\n.centerBlock {\n  display: table;\n  margin: auto; }\n\nul.list-group:after {\n  clear: both;\n  display: block;\n  content: \"\"; }\n\n.list-group-item {\n  float: left; }\n\n.funding-payment-address-input {\n  width: 360px;\n  background-color: #EBEBE4;\n  border: 1px solid #ABADB3;\n  padding: 2px 1px; }\n\n.fa-clipboard {\n  cursor: pointer; }\n\n.funding-item {\n  margin: 20px 0; }\n\n.funding-item .fa-check {\n  color: green; }\n\n.currency-icon {\n  width: 16px;\n  height: 16px;\n  background-position: center;\n  background-repeat: no-repeat;\n  display: inline-block;\n  vertical-align: middle; }\n\n.currency-dash {\n  background-image: url(\"images/dash.png\"); }\n\n.currency-eth {\n  background-image: url(\"images/eth.png\"); }\n\n.currency-btc {\n  background-image: url(\"images/btc.png\"); }\n\n.currency-bcy {\n  background-image: url(\"images/bcy.png\"); }\n\n.currency-omg {\n  background-image: url(\"images/omg.png\"); }\n\n.currency-chp {\n  background-image: url(\"images/chp.png\"); }\n\n.currency-ukg {\n  background-image: url(\"images/ukg.png\"); }\n\n.currency-troy {\n  background-image: url(\"images/troy.png\"); }\n\n.currency-ivy {\n  background-image: url(\"images/ivy.png\"); }\n\n.currency-xmr {\n  background-image: url(\"images/xmr.png\"); }\n\n.table-currency {\n  text-transform: uppercase;\n  min-width: 30px;\n  display: inline-block; }\n\n.save-button {\n  background-color: green;\n  color: white; }\n\n.circ {\n  opacity: 0;\n  stroke-dasharray: 130;\n  stroke-dashoffset: 130;\n  -webkit-transition: all 1s;\n  -moz-transition: all 1s;\n  -ms-transition: all 1s;\n  -o-transition: all 1s;\n  transition: all 1s; }\n\n.tick {\n  stroke-dasharray: 50;\n  stroke-dashoffset: 50;\n  -webkit-transition: stroke-dashoffset 1s 0.5s ease-out;\n  -moz-transition: stroke-dashoffset 1s 0.5s ease-out;\n  -ms-transition: stroke-dashoffset 1s 0.5s ease-out;\n  -o-transition: stroke-dashoffset 1s 0.5s ease-out;\n  transition: stroke-dashoffset 1s 0.5s ease-out; }\n\n.drawn + svg .path {\n  opacity: 1;\n  stroke-dashoffset: 0; }\n\n.faqHeader {\n  font-size: 27px;\n  margin: 20px; }\n\n.panel-heading [data-toggle=\"collapse\"]:after {\n  font-family: 'FontAwesome';\n  content: \"\\f078\";\n  /* \"play\" icon */\n  float: right;\n  color: #F58723;\n  font-size: 18px;\n  line-height: 22px;\n  /* rotate \"play\" icon from > (right arrow) to down arrow */\n  /*    -webkit-transform: rotate(-90deg);\n    -moz-transform: rotate(-90deg);\n    -ms-transform: rotate(-90deg);\n    -o-transform: rotate(-90deg);\n    transform: rotate(-90deg); */ }\n\n.panel-heading [data-toggle=\"collapse\"].collapsed:after {\n  /* rotate \"play\" icon from > (right arrow) to ^ (up arrow) */\n  /*    -webkit-transform: rotate(90deg);\n    -moz-transform: rotate(90deg);\n    -ms-transform: rotate(90deg);\n    -o-transform: rotate(90deg);\n    transform: rotate(90deg); */\n  color: #454444; }\n\n.global-chatbox-header {\n  width: 350px; }\n\n.clear {\n  clear: both; }\n\n#global-chatbox-container {\n  width: 354px;\n  margin-top: 2px;\n  position: relative;\n  z-index: 1; }\n\n#global-chatbox-container::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  opacity: .08;\n  z-index: -1;\n  background: url(\"images/troll.jpg\") no-repeat;\n  overflow: hidden; }\n\n::-webkit-scrollbar {\n  width: 6px;\n  /* for vertical scrollbars */\n  height: 6px;\n  /* for horizontal scrollbars */ }\n\n::-webkit-scrollbar-track {\n  background: rgba(0, 0, 0, 0.05); }\n\n::-webkit-scrollbar-thumb {\n  background: rgba(0, 0, 0, 0.5);\n  height: 6px; }\n\n#global-chatbox {\n  margin-top: 5px;\n  height: 200px;\n  line-height: 14px;\n  font-size: 12px;\n  overflow-y: scroll;\n  overflow-x: hidden;\n  padding: 0px 2px;\n  position: relative;\n  vertical-align: top;\n  float: left;\n  box-sizing: border-box;\n  width: 234px; }\n\n#global-online {\n  width: 120px;\n  display: inline-block;\n  padding: 0px 4px;\n  font-size: 12px;\n  height: 200px;\n  overflow-y: scroll;\n  overflow-x: hidden; }\n\n.tournament-action-button {\n  margin-right: 5px; }\n\n.poker-rooms-joined-label {\n  background-color: green;\n  margin-right: 5px; }\n\n.poker-rooms-current-table {\n  background-color: lightgray; }\n\n.funding-window-sit-down-button {\n  float: right;\n  background-color: #0e6290; }\n\n.cashOutSummary-sent {\n  font-size: 1.5em; }\n\n.cashOutSummary-txHash {\n  font-size: 0.8em; }\n\n.dash-logo-header {\n  background: url(\"images/dash_logo_with_name.png\");\n  height: 20px;\n  width: 99px;\n  display: inline-block; }\n\n.nav-dash-icon {\n  content: url(\"images/dash.png\");\n  vertical-align: -20%; }\n\n.coinspot-icon {\n  content: url(\"images/coinspot.png\"); }\n\n.bitpanda-icon {\n  content: url(\"images/bitpanda.png\"); }\n\n.flash {\n  -moz-animation: flash 1s ease-out;\n  -moz-animation-iteration-count: 1;\n  -webkit-animation: flash 1s ease-out;\n  -webkit-animation-iteration-count: 1;\n  -ms-animation: flash 1s ease-out;\n  -ms-animation-iteration-count: 1; }\n\n@keyframes flash {\n  0% {\n    background-color: transparent; }\n  50% {\n    background-color: #fbf8b2; }\n  100% {\n    background-color: transparent; } }\n\n@-webkit-keyframes flash {\n  0% {\n    background-color: transparent; }\n  50% {\n    background-color: #fbf8b2; }\n  100% {\n    background-color: transparent; } }\n\n@-moz-keyframes flash {\n  0% {\n    background-color: transparent; }\n  50% {\n    background-color: #fbf8b2; }\n  100% {\n    background-color: transparent; } }\n\n@-ms-keyframes flash {\n  0% {\n    background-color: transparent; }\n  50% {\n    background-color: #fbf8b2; }\n  100% {\n    background-color: transparent; } }\n\n.uppercase {\n  text-transform: uppercase; }\n\n.faq-block p {\n  margin-bottom: 20px; }\n\n.faq-block h3 {\n  margin-top: 40px; }\n\n.funding-close-info {\n  font-size: 0.8em;\n  font-style: italic; }\n\n.cash-out-summary-table td {\n  padding: 8px; }\n\n.cash-out-receiving-address-info {\n  font-size: 0.8em;\n  font-style: italic; }\n\n.text-center {\n  text-align: center; }\n\n.margin-top-5 {\n  margin-top: 5px; }\n\n.margin-top-10 {\n  margin-top: 10px; }\n\n.margin-top-20 {\n  margin-top: 20px; }\n\n.funding-window-qr-code {\n  display: inline-block;\n  border: 1px solid black;\n  margin-top: 10px;\n  margin-left: 10px; }\n\n.info-banner {\n  text-align: center;\n  background-color: #fcf8e3;\n  color: #8a6d3b;\n  border-color: #faebcc;\n  padding: 15px;\n  border: 1px solid transparent; }\n\n.info-close {\n  cursor: pointer;\n  float: right; }\n\n.nounderline {\n  text-decoration: none !important; }\n\n.blackCard {\n  color: #000000; }\n\n.redCard {\n  color: #D40000; }\n\n.tournament-info {\n  color: black;\n  font-size: 16px; }\n\n.tournament-starting-in {\n  font-weight: bold;\n  background-color: lightblue;\n  padding: 5px;\n  font-size: 1.4em; }\n\n.next-tournament-register-button {\n  background-color: red;\n  font-size: 28px; }\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('simulations',["require", "exports", "./shared/TableViewRow", "aurelia-framework", "./shared/DataContainer", "./shared/login-request", "./shared/TournmanetStatus", "aurelia-event-aggregator", "./messages", "./shared/TournamentResultView", "./shared/Currency"], function (require, exports, TableViewRow_1, aurelia_framework_1, DataContainer_1, login_request_1, TournmanetStatus_1, aurelia_event_aggregator_1, messages_1, TournamentResultView_1, Currency_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Simulations = (function () {
        function Simulations(ea) {
            this.ea = ea;
            this.handsPlayed = 0;
        }
        Simulations.prototype.test = function () {
            var row1 = this.getTableViewRow(Currency_1.Currency.free, 'table1', 'id1');
            var row2 = this.getTableViewRow('dash', 'table2', 'id2');
            var row3 = this.getTableViewRow('btc', 'table3', 'id3');
            var row4 = this.getTableViewRow('eth', 'table4', 'id4');
            var userData = new DataContainer_1.UserData();
            userData.screenName = 'john';
            userData.initialData = true;
            userData.guid = 'guid1';
            userData.accounts.push(new DataContainer_1.Account('usd', 1000));
            this.sendMessage({ user: userData });
            this.sendMessage({ tableConfigs: [row1, row2, row3, row4] });
            var subscribeTableResult = new DataContainer_1.SubscribeTableResult();
            subscribeTableResult.tableId = "id1";
            subscribeTableResult.tableConfig = row1;
            this.sendMessage({ subscribeTableResult: subscribeTableResult });
            this.sendTournamentSubscriptionResult();
            this.sendGlobalUsers();
            this.testFundAccount();
        };
        Simulations.prototype.getTableViewRow = function (currency, name, id) {
            var row = new TableViewRow_1.TableViewRow();
            row.name = name;
            row.smallBlind = 1298;
            row.smallBlindUsd = 0.1;
            row.bigBlind = 2596;
            row.bigBlindUsd = 0.2;
            row.currency = currency;
            row._id = id;
            row.timeToActSec = 10;
            row.maxBuyIn = 200;
            row.exchangeRate = 7700;
            return row;
        };
        Simulations.prototype.sendSetTableOptionResult = function (sitOutNextHand) {
            var data = new DataContainer_1.DataContainer();
            data.setTableOptionResult = new DataContainer_1.SetTableOptionResult();
            data.setTableOptionResult.tableId = 'id1';
            data.setTableOptionResult.sitOutNextHand = sitOutNextHand;
            this.sendMessage(data);
        };
        Simulations.prototype.sendPaymentHistoryResult = function () {
            var message = new DataContainer_1.DataContainer();
            message.paymentHistoryResult = new DataContainer_1.PaymentHistoryResult();
            message.paymentHistoryResult.payments = [];
            for (var i = 0; i < 20; i++) {
                var confs = Math.random() < 0.5 ? 0 : 1;
                message.paymentHistoryResult.payments.push({
                    timestamp: new Date().toISOString(),
                    type: Math.random() < 0.5 ? 'outgoing' : 'incoming',
                    currency: 'dash',
                    amount: '1000000',
                    status: confs === 1 ? 'complete' : 'pending',
                    confirmations: confs,
                    requiredConfirmations: 1,
                    txHash: 'abcd'
                });
            }
            this.sendMessage(message);
        };
        Simulations.prototype.sendTournamentResult = function () {
            var message = new DataContainer_1.DataContainer();
            message.tournamentResult = new TournamentResultView_1.TournamentResultView('id1', 'Friday Freeroll', 4, "0.01", "dash", false);
            this.sendMessage(message);
        };
        Simulations.prototype.sendTournamentSubscriptionResult = function () {
            var message = new DataContainer_1.DataContainer();
            message.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
            message.tournamentSubscriptionResult.tournaments.push({ status: 1, id: "5aa724aed855ec4e100b70f3", "name": "Friday Freeroll", "currency": "dash", "startTime": "2018-06-04T23:44:34.826Z", "totalPrize": "0.42", "playerCount": 0 });
            this.sendMessage(message);
        };
        Simulations.prototype.sendTournamentUpdate1 = function () {
            var message = new DataContainer_1.DataContainer();
            message.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
            message.tournamentSubscriptionResult.tournaments.push({ id: "5aa724aed855ec4e100b70f3", joined: true, playerCount: 1 });
            this.sendMessage(message);
        };
        Simulations.prototype.sendTournamentUpdate2 = function () {
            var message = new DataContainer_1.DataContainer();
            message.tournamentSubscriptionResult = new DataContainer_1.TournamentSubscriptionResult();
            message.tournamentSubscriptionResult.tournaments.push({ id: "5aa724aed855ec4e100b70f3", status: TournmanetStatus_1.TournmanetStatus.Started });
            this.sendMessage(message);
        };
        Simulations.prototype.sendLoginResult = function () {
            var result = new login_request_1.LoginResult();
            result.success = true;
            var userData = new DataContainer_1.UserData();
            userData.accounts.push(new DataContainer_1.Account('usd', 999));
            userData.accounts.push(new DataContainer_1.Account('dash', 30000000));
            this.sendMessage({ loginResult: result, user: userData });
        };
        Simulations.prototype.sendTransferFundsResult = function () {
            var _this = this;
            setTimeout(function () {
                _this.sendMessage({ transferFundsResult: {
                        success: true,
                        errorMessage: '',
                        currency: 'dash',
                        amount: 0.03,
                        screenName: 'bob'
                    } });
            }, 5000);
        };
        Simulations.prototype.sendGlobalUsers = function () {
            var globalUsers = new DataContainer_1.GlobalUsers();
            globalUsers.initialData = true;
            for (var i = 0; i < 20; i++) {
                globalUsers.users.push(new DataContainer_1.UserStatus("maxLength_" + i, true, 'nl', 'Netherlands'));
            }
            this.sendMessage({
                globalUsers: globalUsers
            });
        };
        Simulations.prototype.testGlobalChatResult = function () {
            var globalChatResult = new DataContainer_1.GlobalChatResult();
            for (var index = 0; index < 10; index++) {
                globalChatResult.initialData = true;
                globalChatResult.messages.push({
                    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
                    screenName: 'maxLength1',
                    tableId: null
                });
            }
            this.sendMessage({
                globalChatResult: globalChatResult
            });
        };
        Simulations.prototype.testTableClosed = function () {
            var _this = this;
            setTimeout(function () {
                var event = { data: JSON.stringify({ tableClosed: { tableId: '' } }) };
                _this.sendMessage(event);
            }, 1500);
        };
        Simulations.prototype.seatPlayers = function () {
            var seats = [];
            seats.push({ name: "anon3", bet: 29552, seat: 0, empty: false, stack: 3000000, avatar: '', playing: true, myturn: false, guid: '', playercards: ['10D', '10C'] });
            seats.push({ name: "anon2", bet: 2596, seat: 3, empty: false, stack: 7456, avatar: '', playing: true, myturn: true, guid: '', hasFolded: false });
            seats.push({ name: "john", bet: 2596, seat: 5, empty: false, stack: 7456, avatar: '', playing: false, myturn: false, guid: 'user1', hasFolded: false, isSittingOut: true });
            this.sendMessage({ seats: seats });
        };
        Simulations.prototype.sendAccountSettings = function () {
            var data = {
                accountSettings: {
                    guid: "abcdef",
                    screenName: "bob"
                }
            };
            this.sendMessage(data);
        };
        Simulations.prototype.sendSetAccountSettingsResult = function () {
            var data = {
                setAccountSettingsResult: {
                    result: false,
                    errorMessage: "Screen name too short. Must be at least 3 characters"
                }
            };
            this.sendMessage(data);
        };
        Simulations.prototype.sendCashOutRequest = function () {
            var result = new DataContainer_1.CashOutRequestResult();
            var currencies = ["dash", "eth", "btc"];
            for (var _i = 0, currencies_1 = currencies; _i < currencies_1.length; _i++) {
                var currency = currencies_1[_i];
                var account = new DataContainer_1.CashOutAccount();
                account.currency = currency;
                account.balance = Math.round(Math.random() * 500000);
                result.accounts.push(account);
            }
            var data = new DataContainer_1.DataContainer();
            data.cashOutRequestResult = result;
            this.sendMessage(data);
        };
        Simulations.prototype.sendCashOutCompleted = function () {
            var successEvent = { accountWithdrawlResult: { success: true, currency: 'dash', fees: 20000, sentAmount: 9512345, balance: 0, errorMessage: "", txHash: "0x8619eb919a1f0fa154d51886749bdc1342a42155394793649534dfc2d809f3da", txHashLink: "https://etherscan.io/tx/${result.txHash}" } };
            var errorEvent = { accountWithdrawlResult: { success: false, fees: 0, sentAmount: 0, balance: 0, errorMessage: "a big long error message here", txHash: "" } };
            this.sendMessage(successEvent);
        };
        Simulations.prototype.sendGame = function () {
            var data = { game: new DataContainer_1.GameEvent('id1') };
            data.game.pot.push(3);
            data.game.tocall = 29552;
            this.sendMessage(data);
        };
        Simulations.prototype.sendAccountFunded = function () {
            var _this = this;
            setTimeout(function () {
                var data = { accountFunded: { balance: 50000000, currency: "DASH", paymentReceived: 50000000 } };
                _this.sendMessage(data);
            }, 1500);
        };
        Simulations.prototype.newHandStartingThenStops = function () {
            var _this = this;
            setTimeout(function () {
                var data = { gameStarting: { startsInNumSeconds: 3, isStarting: true } };
                _this.sendMessage(data);
            }, 1000);
            setTimeout(function () {
                var data = { gameStarting: { isStarting: false } };
                _this.sendMessage(data);
            }, 4000);
        };
        Simulations.prototype.dealBoard = function () {
            var deal = { board: ['2C', '2H', '2S'] };
            this.sendMessage({ deal: deal });
        };
        Simulations.prototype.playerFold = function () {
            var _this = this;
            setTimeout(function () {
                var data = { game: null, seats: [] };
                var game = new DataContainer_1.GameEvent('id1');
                game.action = 'fold';
                data.game = game;
                data.seats.push({ seat: 3, hasFolded: true });
                _this.sendMessage(data);
            }, 1000);
        };
        Simulations.prototype.sendMessage = function (data) {
            console.log('simulation receiving data' + data);
            this.ea.publish(new messages_1.DataMessageEvent(data));
        };
        Simulations.prototype.testFundAccount = function () {
            var _this = this;
            var balance = 64987;
            var currency = 'btc';
            setTimeout(function () {
                var result = new DataContainer_1.FundAccountResult();
                result.currency = currency;
                result.paymentAddress = '19AuoKqQb5Tjj7c32mw5LsjBFvGs9jcfs1';
                result.requiredConfirmations = 1;
                result.addressQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHIAAAByCAYAAACP3YV9AAAAAklEQVR4AewaftIAAAQ6SURBVO3BW2pkSRYAQfcg979ln+qPA0lzRb6kGnUQZvYHx3/e4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjC4tjCjTeo/ISKoTIqrqh8ouIVKqNiqHy3ilcsji0sji3c+FDFJ1QeUXlXxVdUvlvFJ1TesTi2sDi2cOMbqTxS8YyKoTIqhsqo+AkVQ+VVKo9UfGpxbGFxbOHGL6UyKh5RGRVD5SsVQ+WKyqj4rRbHFhbHFm78UhVDZVSMiqHyjIqhMiqGyhWVUfGbLI4tLI4t3PhGFT+hYqiMiisqo+KeyhWVUTFUPlHxNyyOLSyOLSyOLdz4kMpPUBkVr6gYKvcqhsqoGCqjYqg8ovL/sDi2sDi2YH/wC6m8ouIZKlcqhsojFb/J4tjC4tjCjTeojIqhcqViqDyjYqiMiisqVyqeoTIqhsqouKIyKr6iMiqGyr9VvGJxbGFxbMH+4AeojIpPqIyKofKJinepjIqh8pWKR1T+UfGKxbGFxbGFGx9SuVIxVJ5RcaViqIyKoXKl4hkq36HinsoVlSsV71gcW1gcW7A/+IDKKypepTIqrqiMimeovKviu6j8W8UrFscWFscW7A9epHKl4orKJyqGyqh4ROUrFVdUHqm4onKv4m9YHFtYHFu48UNURsWrVH5CxRWVUfGIyqgYFV9RGRVD5d8qXrE4trA4tnDjDRWvUBkV91RGxagYKldURsVQGRX3VK5UXFF5RGVU3FP5GxbHFhbHFhbHFm58SOWRiq9UvKLikYqhcq/iisqoGBVD5UrFUPlKxSMV71gcW1gcW7jxBpVHKp6hMiqGyhWVRyq+ojIqHlH5Liqj4jstji0sji3YH3xA5ZGKoXKvYqhcqbiiMiquqHyiYqi8quJvWBxbWBxbuPEGlVExVB6puKcyKobKFZUrKs+oGCqvqHhE5Z7KqPgpi2MLi2MLN95Q8UjFUPlKxZWKoTIqhsonKobKIyqjYqh8pWKoXKn41OLYwuLYwo0PqYyKRyruqVypeEXFUPmKyqgYFVdUrqg8Q+VKxXdaHFtYHFuwP/iFVN5V8RNURsUzVK5UfKfFsYXFsYUbb1D5CRVXKq6oPKLylYpHVB5RGRXPULlS8Y7FsYXFsYUbH6r4hMojKo9UDJWvVHy3imdUXFEZKv+oeMXi2MLi2MLi2MKNb6TySMUzKt5V8QyVUTFURsVQGSqvUhkVVyresTi2sDi2cOOXUhkVr1AZFfdURsVQGRWvqHiVyndaHFtYHFu48R+g8oqKr1QMlUdUXqFyr+KRiqHyj4pXLI4tLI4t3PhGFd+lYqiMiqEyKl5VcUXlXRX3VK5UDJVR8Y7FsYXFsYUbH1L5CSqvUBkVz1AZFaNiqFypGCqj4l7F37A4tmB/cPznLY4tLI4tLI4tLI4tLI4tLI4tLI4tLI4tLI4tLI4tLI4t/A9tKy36yOmzGAAAAABJRU5ErkJggg==';
                _this.sendMessage({ fundAccountResult: result });
            }, 5000);
            setTimeout(function () {
                _this.sendMessage({ accountFunded: { paymentReceived: balance, currency: currency, confirmations: 0 } });
            }, 7000);
            setTimeout(function () {
                _this.sendMessage({ accountFunded: { paymentReceived: balance, balance: balance, currency: currency, confirmations: 1 } });
            }, 9000);
        };
        Simulations = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator])
        ], Simulations);
        return Simulations;
    }());
    exports.Simulations = Simulations;
});



define('shared/tournmanet-view-row',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentViewRow = (function () {
        function TournamentViewRow() {
        }
        return TournamentViewRow;
    }());
    exports.TournamentViewRow = TournamentViewRow;
});



define('shared/signup-request',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RegisterRequest = (function () {
        function RegisterRequest() {
        }
        return RegisterRequest;
    }());
    exports.RegisterRequest = RegisterRequest;
    var RegisterResult = (function () {
        function RegisterResult() {
        }
        return RegisterResult;
    }());
    exports.RegisterResult = RegisterResult;
});



define('shared/reset-result',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ResetRequest = (function () {
        function ResetRequest() {
        }
        return ResetRequest;
    }());
    exports.ResetRequest = ResetRequest;
    var ResetResult = (function () {
        function ResetResult() {
            this.errors = [];
        }
        return ResetResult;
    }());
    exports.ResetResult = ResetResult;
});



define('shared/protobuf-config',["require", "exports", "protobufjs"], function (require, exports, protobufjs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Root = protobufjs.Root, Type = protobufjs.Type, Field = protobufjs.Field;
    var ProtobufConfig = (function () {
        function ProtobufConfig() {
            this.root = new Root();
            this.rounding = 6;
            this.namespace = this.root.define("shared");
        }
        ProtobufConfig.prototype.init = function () {
            if (this.initialized)
                return;
            this.addDataContainerMappings();
            this.addClientMessageMappings();
            this.initialized = true;
        };
        ProtobufConfig.prototype.addClientMessageMappings = function () {
            {
                var joinTableRequest = new Type("JoinTableRequest");
                joinTableRequest.add(new Field("amount", 1, "int64"));
                joinTableRequest.add(new Field("seat", 2, "int32"));
                joinTableRequest.add(new Field("tableId", 3, "string"));
                this.namespace.add(joinTableRequest);
            }
            {
                var listTablesRequest = new Type("ListTablesRequest");
                this.namespace.add(listTablesRequest);
            }
            {
                var subscribeToTableRequest = new Type("SubscribeToTableRequest");
                subscribeToTableRequest.add(new Field("tableId", 1, "string"));
                subscribeToTableRequest.add(new Field("tournamentId", 2, "string"));
                this.namespace.add(subscribeToTableRequest);
            }
            {
                var exchangeRatesRequest = new Type("ExchangeRatesRequest");
                this.namespace.add(exchangeRatesRequest);
            }
            {
                var globalChatRequest = new Type("GlobalChatRequest");
                globalChatRequest.add(new Field("initialData", 1, "bool"));
                globalChatRequest.add(new Field("message", 2, "string"));
                this.namespace.add(globalChatRequest);
            }
            {
                var tournamentSubscriptionRequest = new Type("TournamentSubscriptionRequest");
                this.namespace.add(tournamentSubscriptionRequest);
            }
            {
                var leaveTableRequest = new Type("LeaveTableRequest");
                leaveTableRequest.add(new Field("tableId", 1, "string"));
                this.namespace.add(leaveTableRequest);
            }
            {
                var loginRequest = new Type("LoginRequest");
                loginRequest.add(new Field("email", 1, "string"));
                loginRequest.add(new Field("password", 2, "string"));
                this.namespace.add(loginRequest);
            }
            {
                var logoutRequest = new Type("LogoutRequest");
                this.namespace.add(logoutRequest);
            }
            {
                var registerRequest = new Type("RegisterRequest");
                registerRequest.add(new Field("screenName", 1, "string"));
                registerRequest.add(new Field("email", 2, "string"));
                registerRequest.add(new Field("password", 3, "string"));
                registerRequest.add(new Field("confirmPassword", 4, "string"));
                registerRequest.add(new Field("tournamentId", 5, "string"));
                this.namespace.add(registerRequest);
            }
            {
                var forgotRequest = new Type("ForgotRequest");
                forgotRequest.add(new Field("email", 1, "string"));
                this.namespace.add(forgotRequest);
            }
            {
                var foldRequest = new Type("FoldRequest");
                foldRequest.add(new Field("tableId", 1, "string"));
                this.namespace.add(foldRequest);
            }
            {
                var betRequest = new Type("BetRequest");
                betRequest.add(new Field("tableId", 1, "string"));
                betRequest.add(new Field("amount", 2, "int32"));
                this.namespace.add(betRequest);
            }
            {
                var fundAccountRequest = new Type("FundAccountRequest");
                fundAccountRequest.add(new Field("currency", 1, "string"));
                this.namespace.add(fundAccountRequest);
            }
            {
                var accountWithdrawlRequest = new Type("AccountWithdrawlRequest");
                accountWithdrawlRequest.add(new Field("currency", 1, "string"));
                accountWithdrawlRequest.add(new Field("receivingAddress", 2, "string"));
                accountWithdrawlRequest.add(new Field("amount", 3, "string"));
                this.namespace.add(accountWithdrawlRequest);
            }
            {
                var setTableOptionRequest = new Type("SetTableOptionRequest");
                setTableOptionRequest.add(new Field("tableId", 1, "string"));
                setTableOptionRequest.add(new Field("sitOutNextHand", 2, "bool"));
                setTableOptionRequest.add(new Field("autoCheck", 3, "bool"));
                setTableOptionRequest.add(new Field("autoFold", 4, "bool"));
                this.namespace.add(setTableOptionRequest);
            }
            {
                var chatRequest = new Type("ChatRequest");
                chatRequest.add(new Field("tableId", 1, "string"));
                chatRequest.add(new Field("message", 2, "string"));
                this.namespace.add(chatRequest);
            }
            {
                var cashOutRequest = new Type("CashOutRequest");
                this.namespace.add(cashOutRequest);
            }
            {
                var getAccountSettingsRequest = new Type("GetAccountSettingsRequest");
                this.namespace.add(getAccountSettingsRequest);
            }
            {
                var setAccountSettingsRequest = new Type("SetAccountSettingsRequest");
                setAccountSettingsRequest.add(new Field("screenName", 1, "string"));
                setAccountSettingsRequest.add(new Field("muteSounds", 2, "bool"));
                this.namespace.add(setAccountSettingsRequest);
            }
            {
                var transferFundsRequest = new Type("TransferFundsRequest");
                transferFundsRequest.add(new Field("screenName", 1, "string"));
                transferFundsRequest.add(new Field("currency", 2, "string"));
                transferFundsRequest.add(new Field("amount", 3, "int32"));
                this.namespace.add(transferFundsRequest);
            }
            {
                var pingRequest = new Type("PingRequest");
                this.namespace.add(pingRequest);
            }
            {
                var tournamentRegisterRequest = new Type("TournamentRegisterRequest");
                tournamentRegisterRequest.add(new Field("tournamentId", 1, "string"));
                this.namespace.add(tournamentRegisterRequest);
            }
            {
                var paymentHistoryRequest = new Type("PaymentHistoryRequest");
                this.namespace.add(paymentHistoryRequest);
            }
            {
                var tournamentInfoRequest = new Type("TournamentInfoRequest");
                tournamentInfoRequest.add(new Field("tournamentId", 1, "string"));
                this.namespace.add(tournamentInfoRequest);
            }
            {
                var rebuyRequest = new Type("RebuyRequest");
                rebuyRequest.add(new Field("tournamentId", 1, "string"));
                this.namespace.add(rebuyRequest);
            }
            var message = new Type("ClientMessage");
            message.add(new Field("loginRequest", 1, "LoginRequest"));
            message.add(new Field("logoutRequest", 2, "LogoutRequest"));
            message.add(new Field("registerRequest", 3, "RegisterRequest"));
            message.add(new Field("forgotRequest", 4, "RegisterRequest"));
            message.add(new Field("joinTableRequest", 5, "JoinTableRequest"));
            message.add(new Field("listTablesRequest", 6, "ListTablesRequest"));
            message.add(new Field("subscribeToTableRequest", 7, "SubscribeToTableRequest"));
            message.add(new Field("exchangeRatesRequest", 8, "ExchangeRatesRequest"));
            message.add(new Field("globalChatRequest", 9, "GlobalChatRequest"));
            message.add(new Field("tournamentSubscriptionRequest", 10, "TournamentSubscriptionRequest"));
            message.add(new Field("leaveTableRequest", 11, "LeaveTableRequest"));
            message.add(new Field("fold", 12, "FoldRequest"));
            message.add(new Field("bet", 13, "BetRequest"));
            message.add(new Field("fundAccountRequest", 14, "FundAccountRequest"));
            message.add(new Field("accountWithdrawlRequest", 15, "AccountWithdrawlRequest"));
            message.add(new Field("setTableOptionRequest", 16, "SetTableOptionRequest"));
            message.add(new Field("chatRequest", 17, "ChatRequest"));
            message.add(new Field("cashOutRequest", 18, "CashOutRequest"));
            message.add(new Field("getAccountSettingsRequest", 19, "GetAccountSettingsRequest"));
            message.add(new Field("setAccountSettingsRequest", 20, "SetAccountSettingsRequest"));
            message.add(new Field("transferFundsRequest", 21, "TransferFundsRequest"));
            message.add(new Field("ping", 22, "PingRequest"));
            message.add(new Field("tournamentRegisterRequest", 23, "TournamentRegisterRequest"));
            message.add(new Field("paymentHistoryRequest", 24, "PaymentHistoryRequest"));
            message.add(new Field("tournamentInfoRequest", 25, "TournamentInfoRequest"));
            message.add(new Field("rebuyRequest", 26, "RebuyRequest"));
            this.namespace.add(message);
        };
        ProtobufConfig.prototype.addDataContainerMappings = function () {
            var tableViewRow = new Type("TableViewRow");
            tableViewRow.add(new Field("_id", 1, "string"));
            tableViewRow.add(new Field("name", 2, "string"));
            tableViewRow.add(new Field("smallBlind", 3, "double"));
            tableViewRow.add(new Field("smallBlindUsd", 4, "double"));
            tableViewRow.add(new Field("bigBlind", 5, "double"));
            tableViewRow.add(new Field("bigBlindUsd", 6, "double"));
            tableViewRow.add(new Field("currency", 7, "string"));
            tableViewRow.add(new Field("exchangeRate", 8, "double"));
            tableViewRow.add(new Field("timeToActSec", 9, "int32"));
            tableViewRow.add(new Field("maxPlayers", 10, "int32"));
            tableViewRow.add(new Field("numPlayers", 11, "int32"));
            tableViewRow.add(new Field("maxBuyIn", 12, "int32"));
            tableViewRow.add(new Field("tournamentId", 13, "string"));
            this.namespace.add(tableViewRow);
            var chatMessage = new Type("ChatMessage");
            chatMessage.add(new Field("tableId", 1, "string"));
            chatMessage.add(new Field("message", 2, "string"));
            chatMessage.add(new Field("screenName", 3, "string"));
            this.namespace.add(chatMessage);
            var globalChatResult = new Type("GlobalChatResult");
            globalChatResult.add(new Field("initialData", 1, "bool"));
            globalChatResult.add(new Field("messages", 2, "ChatMessage", "repeated"));
            this.namespace.add(globalChatResult);
            var loginResult = new Type("LoginResult");
            loginResult.add(new Field("success", 1, "bool"));
            loginResult.add(new Field("errorMessage", 2, "string"));
            loginResult.add(new Field("sid", 3, "string"));
            loginResult.add(new Field("version", 4, "string"));
            this.namespace.add(loginResult);
            var account = new Type("Account");
            account.add(new Field("currency", 1, "string"));
            account.add(new Field("balance", 2, "double"));
            this.namespace.add(account);
            var version = new Type("Version");
            version.add(new Field("version", 1, "string"));
            version.add(new Field("appName", 2, "string"));
            version.add(new Field("appSupportEmail", 3, "string"));
            version.add(new Field("cdn", 4, "string"));
            this.namespace.add(version);
            var userData = new Type("UserData");
            userData.add(new Field("guid", 1, "string"));
            userData.add(new Field("screenName", 2, "string"));
            userData.add(new Field("accounts", 3, "Account", "repeated"));
            userData.add(new Field("initialData", 4, "bool"));
            userData.add(new Field("notifyUserStatus", 5, "bool"));
            userData.add(new Field("activated", 6, "bool"));
            userData.add(new Field("muteSounds", 7, "bool"));
            this.namespace.add(userData);
            var chatMessageResult = new Type("ChatMessageResult");
            chatMessageResult.add(new Field("tableId", 1, "string"));
            chatMessageResult.add(new Field("initialData", 2, "bool"));
            chatMessageResult.add(new Field("messages", 3, "ChatMessage", "repeated"));
            this.namespace.add(chatMessageResult);
            var subscribeTableResult = new Type("SubscribeTableResult");
            subscribeTableResult.add(new Field("tableId", 1, "string"));
            subscribeTableResult.add(new Field("shutdownRequested", 2, "bool"));
            subscribeTableResult.add(new Field("tableConfig", 3, "TableViewRow"));
            subscribeTableResult.add(new Field("tournamentId", 4, "string"));
            subscribeTableResult.add(new Field("nextBlind", 5, "NextBlind"));
            this.namespace.add(subscribeTableResult);
            var potResult = new Type("PotResult");
            potResult.add(new Field("seatWinners", 1, "int32", "repeated"));
            potResult.add(new Field("winningHand", 2, "string"));
            potResult.add(new Field("bestHandCards", 3, "string", "repeated"));
            potResult.add(new Field("amount", 4, "int32"));
            potResult.add(new Field("amountFormatted", 5, "string"));
            this.namespace.add(potResult);
            var gameEvent = new Type("GameEvent");
            gameEvent.add(new Field("pot", 1, "double", "repeated"));
            gameEvent.add(new Field("tocall", 2, "double"));
            gameEvent.add(new Field("action", 3, "string"));
            gameEvent.add(new Field("chipsToPot", 4, "bool"));
            gameEvent.add(new Field("street", 5, "string"));
            gameEvent.add(new Field("potResults", 6, "PotResult", "repeated"));
            gameEvent.add(new Field("dealer", 7, "int32"));
            gameEvent.add(new Field("board", 8, "string", "repeated"));
            gameEvent.add(new Field("tableId", 9, "string"));
            gameEvent.add(new Field("lastRaise", 10, "double"));
            this.namespace.add(gameEvent);
            var tableSeatEvents = new Type("TableSeatEvents");
            tableSeatEvents.add(new Field("tableId", 1, "string"));
            tableSeatEvents.add(new Field("seats", 2, "TableSeatEvent", "repeated"));
            this.namespace.add(tableSeatEvents);
            var tableSeatEvent = new Type("TableSeatEvent");
            tableSeatEvent.add(new Field("name", 1, "string"));
            tableSeatEvent.add(new Field("seat", 2, "int32"));
            tableSeatEvent.add(new Field("stack", 3, "double"));
            tableSeatEvent.add(new Field("empty", 4, "bool"));
            tableSeatEvent.add(new Field("playing", 5, "bool"));
            tableSeatEvent.add(new Field("guid", 6, "string"));
            tableSeatEvent.add(new Field("playercards", 7, "string", "repeated"));
            tableSeatEvent.add(new Field("bet", 8, "double"));
            tableSeatEvent.add(new Field("myturn", 9, "bool"));
            tableSeatEvent.add(new Field("hasFolded", 10, "bool"));
            tableSeatEvent.add(new Field("hasRaised", 11, "bool"));
            tableSeatEvent.add(new Field("hasCalled", 12, "bool"));
            tableSeatEvent.add(new Field("isSittingOut", 13, "bool"));
            tableSeatEvent.add(new Field("timeToActSec", 14, "int32"));
            tableSeatEvent.add(new Field("avatar", 15, "string"));
            this.namespace.add(tableSeatEvent);
            var nextBlind = new Type("NextBlind");
            nextBlind.add(new Field("smallBlind", 1, "int32"));
            nextBlind.add(new Field("bigBlind", 2, "int32"));
            nextBlind.add(new Field("remainingSec", 3, "int32"));
            this.namespace.add(nextBlind);
            var blindsChangingEvent = new Type("BlindsChangingEvent");
            blindsChangingEvent.add(new Field("smallBlind", 1, "int32"));
            blindsChangingEvent.add(new Field("bigBlind", 2, "int32"));
            this.namespace.add(blindsChangingEvent);
            var gameStartingEvent = new Type("GameStartingEvent");
            gameStartingEvent.add(new Field("startsInNumSeconds", 1, "int32"));
            gameStartingEvent.add(new Field("isStarting", 2, "bool"));
            gameStartingEvent.add(new Field("blindsChanging", 3, "BlindsChangingEvent"));
            gameStartingEvent.add(new Field("nextBlind", 4, "NextBlind"));
            gameStartingEvent.add(new Field("tableId", 5, "string"));
            this.namespace.add(gameStartingEvent);
            var deal = new Type("DealHoleCardsEvent");
            deal.add(new Field("holecards", 1, "string", "repeated"));
            deal.add(new Field("board", 2, "string", "repeated"));
            deal.add(new Field("tableId", 3, "string"));
            this.namespace.add(deal);
            var error = new Type("PokerError");
            error.add(new Field("message", 1, "string"));
            this.namespace.add(error);
            var fundAccountResult = new Type("FundAccountResult");
            fundAccountResult.add(new Field("addressQrCode", 1, "string"));
            fundAccountResult.add(new Field("currency", 2, "string"));
            fundAccountResult.add(new Field("paymentAddress", 3, "string"));
            fundAccountResult.add(new Field("requiredConfirmations", 4, "int32"));
            this.namespace.add(fundAccountResult);
            var accountFunded = new Type("accountFunded");
            accountFunded.add(new Field("balance", 1, "double"));
            accountFunded.add(new Field("confirmations", 2, "int32"));
            accountFunded.add(new Field("currency", 3, "string"));
            accountFunded.add(new Field("paymentReceived", 4, "double"));
            this.namespace.add(accountFunded);
            var accountWithdrawlResult = new Type("AccountWithdrawlResult");
            accountWithdrawlResult.add(new Field("balance", 1, "string"));
            accountWithdrawlResult.add(new Field("fees", 2, "string"));
            accountWithdrawlResult.add(new Field("sentAmount", 3, "string"));
            accountWithdrawlResult.add(new Field("currency", 4, "string"));
            accountWithdrawlResult.add(new Field("errorMessage", 5, "string"));
            accountWithdrawlResult.add(new Field("success", 6, "bool"));
            accountWithdrawlResult.add(new Field("txHash", 7, "string"));
            accountWithdrawlResult.add(new Field("txHashLink", 8, "string"));
            this.namespace.add(accountWithdrawlResult);
            var field1 = new Type("UserStatus");
            field1.add(new Field("country", 1, "string"));
            field1.add(new Field("countryCode", 2, "string"));
            field1.add(new Field("online", 3, "bool"));
            field1.add(new Field("screenName", 4, "string"));
            this.namespace.add(field1);
            var globalUsers = new Type("GlobalUsers");
            globalUsers.add(new Field("initialData", 1, "bool"));
            globalUsers.add(new Field("users", 2, "UserStatus", "repeated"));
            this.namespace.add(globalUsers);
            var cashOutAccount = new Type("CashOutAccount");
            cashOutAccount.add(new Field("balance", 1, "double"));
            cashOutAccount.add(new Field("currency", 2, "string"));
            cashOutAccount.add(new Field("insufficientBalance", 3, "bool"));
            cashOutAccount.add(new Field("refundAddress", 4, "string"));
            cashOutAccount.add(new Field("refundAddressCount", 5, "int32"));
            this.namespace.add(cashOutAccount);
            var cashOutRequestResult = new Type("CashOutRequestResult");
            cashOutRequestResult.add(new Field("accounts", 1, "CashOutAccount", "repeated"));
            this.namespace.add(cashOutRequestResult);
            var setTableOptionResult = new Type("SetTableOptionResult");
            setTableOptionResult.add(new Field("tableId", 1, "string"));
            setTableOptionResult.add(new Field("sitOutNextHand", 2, "bool"));
            setTableOptionResult.add(new Field("autoFold", 3, "bool"));
            setTableOptionResult.add(new Field("autoCheck", 4, "bool"));
            this.namespace.add(setTableOptionResult);
            var accountSettings = new Type("GetAccountSettingsResult");
            accountSettings.add(new Field("email", 1, "string"));
            accountSettings.add(new Field("screenName", 2, "string"));
            accountSettings.add(new Field("muteSounds", 3, "bool"));
            this.namespace.add(accountSettings);
            var setAccountSettingsResult = new Type("SetAccountSettingsResult");
            setAccountSettingsResult.add(new Field("errorMessage", 1, "string"));
            setAccountSettingsResult.add(new Field("success", 2, "bool"));
            this.namespace.add(setAccountSettingsResult);
            var tableClosed = new Type("TableClosed");
            tableClosed.add(new Field("tableId", 1, "string"));
            this.namespace.add(tableClosed);
            var transferFundsResult = new Type("TransferFundsResult");
            transferFundsResult.add(new Field("amount", 1, "double"));
            transferFundsResult.add(new Field("currency", 2, "string"));
            transferFundsResult.add(new Field("errorMessage", 3, "string"));
            transferFundsResult.add(new Field("screenName", 4, "string"));
            transferFundsResult.add(new Field("success", 5, "bool"));
            this.namespace.add(transferFundsResult);
            var exchangeRate = new Type("ExchangeRate");
            exchangeRate.add(new Field("base", 1, "string"));
            exchangeRate.add(new Field("target", 2, "string"));
            exchangeRate.add(new Field("price", 3, "double"));
            exchangeRate.add(new Field("change", 4, "double"));
            exchangeRate.add(new Field("volume", 5, "int32"));
            this.namespace.add(exchangeRate);
            var exchangeRateResult = new Type("ExchangeRateResult");
            exchangeRateResult.add(new Field("rates", 1, "ExchangeRate", "repeated"));
            this.namespace.add(exchangeRateResult);
            var pong = new Type("Pong");
            this.namespace.add(pong);
            var logoutResult = new Type("LogoutResult");
            this.namespace.add(logoutResult);
            var registerResult = new Type("RegisterResult");
            registerResult.add(new Field("errorMessage", 1, "string"));
            registerResult.add(new Field("message", 2, "string"));
            registerResult.add(new Field("success", 3, "bool"));
            this.namespace.add(registerResult);
            var tournamentViewRow = new Type("TournamentViewRow");
            tournamentViewRow.add(new Field("id", 1, "string"));
            tournamentViewRow.add(new Field("name", 2, "string"));
            tournamentViewRow.add(new Field("currency", 3, "string"));
            tournamentViewRow.add(new Field("startTime", 4, "string"));
            tournamentViewRow.add(new Field("totalPrize", 5, "string"));
            tournamentViewRow.add(new Field("totalPrizeUsd", 6, "string"));
            tournamentViewRow.add(new Field("playerCount", 7, "int32"));
            tournamentViewRow.add(new Field("joined", 8, "bool"));
            tournamentViewRow.add(new Field("status", 9, "int32"));
            tournamentViewRow.add(new Field("lateRegistrationMin", 10, "int32"));
            tournamentViewRow.add(new Field("buyIn", 11, "string"));
            this.namespace.add(tournamentViewRow);
            var tournamentSubscriptionResult = new Type("TournamentSubscriptionResult");
            tournamentSubscriptionResult.add(new Field("tournaments", 1, "TournamentViewRow", "repeated"));
            tournamentSubscriptionResult.add(new Field("tournamentCount", 2, "int32"));
            this.namespace.add(tournamentSubscriptionResult);
            var forgotResult = new Type("ForgotResult");
            forgotResult.add(new Field("errors", 1, "string", "repeated"));
            forgotResult.add(new Field("message", 2, "string"));
            forgotResult.add(new Field("success", 3, "bool"));
            this.namespace.add(forgotResult);
            var tournamentResultView = new Type("TournamentResultView");
            tournamentResultView.add(new Field("tournamentName", 1, "string"));
            tournamentResultView.add(new Field("placing", 2, "int32"));
            tournamentResultView.add(new Field("rebuyAmount", 3, "string"));
            tournamentResultView.add(new Field("currency", 4, "string"));
            tournamentResultView.add(new Field("tournamentId", 5, "string"));
            tournamentResultView.add(new Field("canRebuy", 6, "bool"));
            this.namespace.add(tournamentResultView);
            var paymentHistoryResult = new Type("PaymentHistoryResult");
            paymentHistoryResult.add(new Field("payments", 1, "PaymentHistoryRowView", "repeated"));
            this.namespace.add(paymentHistoryResult);
            var paymentHistoryRowView = new Type("PaymentHistoryRowView");
            paymentHistoryRowView.add(new Field("amount", 1, "string"));
            paymentHistoryRowView.add(new Field("confirmations", 2, "int32"));
            paymentHistoryRowView.add(new Field("currency", 3, "string"));
            paymentHistoryRowView.add(new Field("requiredConfirmations", 4, "int32"));
            paymentHistoryRowView.add(new Field("status", 5, "string"));
            paymentHistoryRowView.add(new Field("timestamp", 6, "string"));
            paymentHistoryRowView.add(new Field("type", 7, "string"));
            paymentHistoryRowView.add(new Field("txHash", 8, "string"));
            paymentHistoryRowView.add(new Field("comment", 9, "string"));
            this.namespace.add(paymentHistoryRowView);
            var blindConfig = new Type("BlindConfig");
            blindConfig.add(new Field("smallBlind", 1, "int32"));
            blindConfig.add(new Field("bigBlind", 2, "int32"));
            blindConfig.add(new Field("timeMin", 3, "int32"));
            this.namespace.add(blindConfig);
            var tournamentResultRowView = new Type("TournamentResultRowView");
            tournamentResultRowView.add(new Field("screenName", 1, "string"));
            tournamentResultRowView.add(new Field("placing", 2, "int32"));
            tournamentResultRowView.add(new Field("stack", 3, "double"));
            this.namespace.add(tournamentResultRowView);
            var tournamentInfoResult = new Type("TournamentInfoResult");
            tournamentInfoResult.add(new Field("prizes", 1, "string", "repeated"));
            tournamentInfoResult.add(new Field("blindConfig", 2, "BlindConfig", "repeated"));
            tournamentInfoResult.add(new Field("results", 3, "TournamentResultRowView", "repeated"));
            tournamentInfoResult.add(new Field("currency", 4, "string"));
            tournamentInfoResult.add(new Field("playersPerTable", 5, "int32"));
            tournamentInfoResult.add(new Field("startingChips", 6, "int32"));
            tournamentInfoResult.add(new Field("timeToActSec", 7, "int32"));
            tournamentInfoResult.add(new Field("lateRegistrationMin", 8, "int32"));
            tournamentInfoResult.add(new Field("evictAfterIdleMin", 9, "int32"));
            tournamentInfoResult.add(new Field("name", 10, "string"));
            tournamentInfoResult.add(new Field("buyIn", 11, "string"));
            this.namespace.add(tournamentInfoResult);
            var tableConfigs = new Type("TableConfigs");
            tableConfigs.add(new Field("rows", 4, "TableViewRow", "repeated"));
            this.namespace.add(tableConfigs);
            var duplicateIpAddress = new Type("DuplicateIpAddress");
            this.namespace.add(duplicateIpAddress);
            var message = new Type("DataContainer");
            message.add(new Field("loginResult", 1, "LoginResult"));
            message.add(new Field("user", 2, "UserData"));
            message.add(new Field("globalChatResult", 3, "GlobalChatResult"));
            message.add(new Field("tableConfigs", 4, "TableConfigs"));
            message.add(new Field("chatMessageResult", 5, "ChatMessageResult"));
            message.add(new Field("subscribeTableResult", 6, "SubscribeTableResult"));
            message.add(new Field("game", 7, "GameEvent"));
            message.add(new Field("tableSeatEvents", 8, "TableSeatEvents"));
            message.add(new Field("gameStarting", 9, "GameStartingEvent"));
            message.add(new Field("deal", 10, "DealHoleCardsEvent"));
            message.add(new Field("error", 11, "PokerError"));
            message.add(new Field("fundAccountResult", 12, "FundAccountResult"));
            message.add(new Field("accountFunded", 13, "accountFunded"));
            message.add(new Field("accountWithdrawlResult", 14, "AccountWithdrawlResult"));
            message.add(new Field("globalUsers", 15, "GlobalUsers"));
            message.add(new Field("cashOutRequestResult", 16, "CashOutRequestResult"));
            message.add(new Field("setTableOptionResult", 17, "SetTableOptionResult"));
            message.add(new Field("accountSettings", 18, "GetAccountSettingsResult"));
            message.add(new Field("setAccountSettingsResult", 19, "SetAccountSettingsResult"));
            message.add(new Field("tableClosed", 20, "TableClosed"));
            message.add(new Field("transferFundsResult", 21, "TransferFundsResult"));
            message.add(new Field("exchangeRates", 22, "ExchangeRateResult"));
            message.add(new Field("pong", 23, "Pong"));
            message.add(new Field("logoutResult", 24, "LogoutResult"));
            message.add(new Field("registerResult", 25, "RegisterResult"));
            message.add(new Field("tournamentSubscriptionResult", 26, "TournamentSubscriptionResult"));
            message.add(new Field("forgotResult", 27, "ForgotResult"));
            message.add(new Field("tournamentResult", 28, "TournamentResultView"));
            message.add(new Field("paymentHistoryResult", 29, "PaymentHistoryResult"));
            message.add(new Field("tournamentInfoResult", 30, "TournamentInfoResult"));
            message.add(new Field("version", 31, "Version"));
            message.add(new Field("duplicateIpAddress", 32, "DuplicateIpAddress"));
            this.namespace.add(message);
        };
        ProtobufConfig.prototype.defined = function (data) {
            var protoMessageDefinition = this.root.lookupType("shared.DataContainer");
            for (var _i = 0, _a = Object.keys(data); _i < _a.length; _i++) {
                var key = _a[_i];
                for (var _b = 0, _c = Object.keys(protoMessageDefinition.fields); _b < _c.length; _b++) {
                    var field = _c[_b];
                    if (field == key) {
                        return true;
                    }
                }
            }
            return false;
        };
        ProtobufConfig.prototype.serialize = function (data, type) {
            var protoMessageDefinition = this.root.lookupType("shared." + type);
            var errMsg = protoMessageDefinition.verify(data);
            if (errMsg)
                throw Error(errMsg);
            var message = protoMessageDefinition.create(data);
            var buffer = protoMessageDefinition.encode(message).finish();
            return buffer;
        };
        ProtobufConfig.prototype.deserialize = function (buffer, type) {
            var byteArray = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
            var protoMessageDefinition = this.root.lookupType("shared." + type);
            var message = protoMessageDefinition.decode(byteArray);
            var object = protoMessageDefinition.toObject(message, {
                longs: String,
                enums: String,
                bytes: String
            });
            this.cleanupFloats(object, type);
            return object;
        };
        ProtobufConfig.prototype.cleanupFloats = function (object, type) {
            if (type === "DataContainer") {
                if (object.user != null && object.user.accounts != null) {
                    for (var _i = 0, _a = object.user.accounts; _i < _a.length; _i++) {
                        var account = _a[_i];
                        account.balance = this.roundFloat(account.balance);
                    }
                }
                if (object.game && object.game.tocall)
                    object.game.tocall = parseFloat(object.game.tocall.toFixed(this.rounding));
                if (object.tableConfigs && object.tableConfigs.rows) {
                    for (var _b = 0, _c = object.tableConfigs.rows; _b < _c.length; _b++) {
                        var config = _c[_b];
                        if (config.rake) {
                            config.rake = parseFloat(config.rake.toFixed(this.rounding));
                        }
                    }
                }
                if (object.seats) {
                    for (var _d = 0, _e = object.seats; _d < _e.length; _d++) {
                        var seat = _e[_d];
                        if (seat.stack)
                            seat.stack = parseFloat(seat.stack.toFixed(this.rounding));
                        if (seat.bet)
                            seat.bet = parseFloat(seat.bet.toFixed(this.rounding));
                    }
                }
                if (object.accountFunded) {
                    object.accountFunded.balance = this.roundFloat(object.accountFunded.balance);
                    object.accountFunded.paymentReceived = this.roundFloat(object.accountFunded.paymentReceived);
                }
                if (object.cashOutRequestResult && object.cashOutRequestResult.accounts) {
                    for (var _f = 0, _g = object.cashOutRequestResult.accounts; _f < _g.length; _f++) {
                        var account = _g[_f];
                        account.balance = this.roundFloat(account.balance);
                    }
                }
                if (object.transferFundsResult && object.transferFundsResult.amount) {
                    object.transferFundsResult.amount = this.roundFloat(object.transferFundsResult.amount);
                }
                if (object.exchangeRates != null && object.exchangeRates.rates != null) {
                    for (var _h = 0, _j = object.exchangeRates.rates; _h < _j.length; _h++) {
                        var exchangeRate = _j[_h];
                        exchangeRate.price = this.roundFloat(exchangeRate.price);
                        exchangeRate.change = this.roundFloat(exchangeRate.change);
                    }
                }
                if (object.tournamentInfoResult != null && object.tournamentInfoResult.results) {
                    for (var _k = 0, _l = object.tournamentInfoResult.results; _k < _l.length; _k++) {
                        var result = _l[_k];
                        if (result.stack) {
                            result.stack = this.roundFloat(result.stack);
                        }
                    }
                }
            }
            else if (type === "ClientMessage") {
            }
        };
        ProtobufConfig.prototype.roundFloat = function (val) {
            if (val)
                return parseFloat(val.toFixed(this.rounding));
            return val;
        };
        return ProtobufConfig;
    }());
    exports.default = new ProtobufConfig();
});



define('shared/login-request',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoginRequest = (function () {
        function LoginRequest(email, password) {
            this.email = email;
            this.password = password;
        }
        return LoginRequest;
    }());
    exports.LoginRequest = LoginRequest;
    var LoginResult = (function () {
        function LoginResult() {
        }
        ;
        return LoginResult;
    }());
    exports.LoginResult = LoginResult;
    var LogoutRequest = (function () {
        function LogoutRequest() {
        }
        return LogoutRequest;
    }());
    exports.LogoutRequest = LogoutRequest;
    var LogoutResult = (function () {
        function LogoutResult() {
        }
        return LogoutResult;
    }());
    exports.LogoutResult = LogoutResult;
});



define('shared/forgot-request',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ForgotRequest = (function () {
        function ForgotRequest() {
        }
        return ForgotRequest;
    }());
    exports.ForgotRequest = ForgotRequest;
    var ForgotResult = (function () {
        function ForgotResult() {
            this.errors = [];
        }
        return ForgotResult;
    }());
    exports.ForgotResult = ForgotResult;
});



define('shared/decimal',["require", "exports", "decimal.js"], function (require, exports, decimal_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Decimal = (function () {
        function Decimal(val) {
            this.value = val instanceof decimal_js_1.Decimal ? val : new decimal_js_1.Decimal(val || 0);
            this.setText();
        }
        Decimal.prototype.minus = function (val) {
            return new Decimal(this.value.minus(val.value));
        };
        Decimal.prototype.add = function (val) {
            return new Decimal(this.value.add(val.value));
        };
        Decimal.prototype.mul = function (val) {
            var valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
            return new Decimal(this.value.mul(valDec));
        };
        Decimal.prototype.floor = function () {
            return new Decimal(this.value.floor());
        };
        Decimal.prototype.abs = function () {
            return new Decimal(this.value.abs());
        };
        Decimal.prototype.dividedBy = function (val) {
            var valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
            return new Decimal(this.value.dividedBy(valDec));
        };
        Decimal.prototype.sub = function (val) {
            return new Decimal(this.value.sub(val.value));
        };
        Decimal.prototype.greaterThan = function (val) {
            var valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
            return this.value.greaterThan(valDec);
        };
        Decimal.prototype.greaterThanOrEqualTo = function (val) {
            return this.value.greaterThanOrEqualTo(val.value);
        };
        Decimal.prototype.equals = function (val) {
            var valDec = val instanceof Decimal ? val.value : new decimal_js_1.Decimal(val);
            return this.value.equals(valDec);
        };
        Decimal.prototype.lessThan = function (val) {
            return val.value.greaterThan(this.value);
        };
        Decimal.prototype.toFixed = function (decimalPlaces) {
            return this.value.toFixed(decimalPlaces);
        };
        Decimal.prototype.setText = function () {
            this.text = this.value.toString();
        };
        Decimal.prototype.toString = function () {
            return this.text;
        };
        Decimal.prototype.toNumber = function () {
            return this.value.toNumber();
        };
        Decimal.prototype.round = function (decimalPlaces) {
            return new Decimal(this.toFixed(decimalPlaces));
        };
        return Decimal;
    }());
    exports.Decimal = Decimal;
});



define('shared/activate-request',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ActivateRequest = (function () {
        function ActivateRequest() {
        }
        return ActivateRequest;
    }());
    exports.ActivateRequest = ActivateRequest;
    var ActivateResult = (function () {
        function ActivateResult() {
        }
        return ActivateResult;
    }());
    exports.ActivateResult = ActivateResult;
});



define('shared/TournmanetStatus',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournmanetStatus;
    (function (TournmanetStatus) {
        TournmanetStatus[TournmanetStatus["Started"] = 1] = "Started";
        TournmanetStatus[TournmanetStatus["Complete"] = 2] = "Complete";
        TournmanetStatus[TournmanetStatus["Abandoned"] = 3] = "Abandoned";
    })(TournmanetStatus = exports.TournmanetStatus || (exports.TournmanetStatus = {}));
});



define('shared/TournamentResultView',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentResultView = (function () {
        function TournamentResultView(tournamentId, tournamentName, placing, rebuyAmount, currency, canRebuy) {
            this.tournamentId = tournamentId;
            this.tournamentName = tournamentName;
            this.placing = placing;
            this.rebuyAmount = rebuyAmount;
            this.currency = currency;
            this.canRebuy = canRebuy;
        }
        ;
        return TournamentResultView;
    }());
    exports.TournamentResultView = TournamentResultView;
});



define('shared/TournamentInfoView',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentInfoView = (function () {
        function TournamentInfoView() {
        }
        return TournamentInfoView;
    }());
    exports.TournamentInfoView = TournamentInfoView;
});



define('shared/TournamentInfoRequest',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentInfoRequest = (function () {
        function TournamentInfoRequest(tournamentId) {
            this.tournamentId = tournamentId;
        }
        TournamentInfoRequest.prototype.getFieldName = function () {
            return "tournamentInfoRequest";
        };
        return TournamentInfoRequest;
    }());
    exports.TournamentInfoRequest = TournamentInfoRequest;
    var TournamentInfoResult = (function () {
        function TournamentInfoResult() {
        }
        return TournamentInfoResult;
    }());
    exports.TournamentInfoResult = TournamentInfoResult;
    var TournamentResultRowView = (function () {
        function TournamentResultRowView(screenName, placing) {
            this.screenName = screenName;
            this.placing = placing;
        }
        return TournamentResultRowView;
    }());
    exports.TournamentResultRowView = TournamentResultRowView;
});



define('shared/TableViewRow',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableViewRow = (function () {
        function TableViewRow() {
        }
        return TableViewRow;
    }());
    exports.TableViewRow = TableViewRow;
});



define('shared/PaymentType',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PaymentType = (function () {
        function PaymentType() {
        }
        PaymentType.incoming = 'incoming';
        PaymentType.outgoing = 'outgoing';
        return PaymentType;
    }());
    exports.PaymentType = PaymentType;
});



define('shared/PaymentStatus',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PaymentStatus = (function () {
        function PaymentStatus() {
        }
        PaymentStatus.pending = 'pending';
        PaymentStatus.complete = 'complete';
        PaymentStatus.cancelled = 'cancelled';
        PaymentStatus.flagged = 'flagged';
        return PaymentStatus;
    }());
    exports.PaymentStatus = PaymentStatus;
});



define('shared/NextBlind',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NextBlind = (function () {
        function NextBlind(smallBlind, bigBlind, remainingSec) {
            this.smallBlind = smallBlind;
            this.bigBlind = bigBlind;
            this.remainingSec = remainingSec;
        }
        return NextBlind;
    }());
    exports.NextBlind = NextBlind;
});



define('shared/ExchangeRate',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ExchangeRate = (function () {
        function ExchangeRate() {
        }
        return ExchangeRate;
    }());
    exports.ExchangeRate = ExchangeRate;
});



define('shared/DataContainer',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DataContainer = (function () {
        function DataContainer() {
        }
        return DataContainer;
    }());
    exports.DataContainer = DataContainer;
    var PaymentHistoryResult = (function () {
        function PaymentHistoryResult() {
        }
        return PaymentHistoryResult;
    }());
    exports.PaymentHistoryResult = PaymentHistoryResult;
    var DuplicateIpAddress = (function () {
        function DuplicateIpAddress() {
        }
        return DuplicateIpAddress;
    }());
    exports.DuplicateIpAddress = DuplicateIpAddress;
    var PaymentHistoryRowView = (function () {
        function PaymentHistoryRowView() {
        }
        return PaymentHistoryRowView;
    }());
    exports.PaymentHistoryRowView = PaymentHistoryRowView;
    var Pong = (function () {
        function Pong() {
        }
        return Pong;
    }());
    exports.Pong = Pong;
    var ExchangeRateResult = (function () {
        function ExchangeRateResult() {
        }
        return ExchangeRateResult;
    }());
    exports.ExchangeRateResult = ExchangeRateResult;
    var TransferFundsResult = (function () {
        function TransferFundsResult() {
        }
        return TransferFundsResult;
    }());
    exports.TransferFundsResult = TransferFundsResult;
    var LeaderboardResult = (function () {
        function LeaderboardResult() {
            this.users = [];
        }
        return LeaderboardResult;
    }());
    exports.LeaderboardResult = LeaderboardResult;
    var LeaderboardUser = (function () {
        function LeaderboardUser(screenName, currency, handsPlayed, profitLoss) {
            this.screenName = screenName;
            this.currency = currency;
            this.handsPlayed = handsPlayed;
            this.profitLoss = profitLoss;
        }
        return LeaderboardUser;
    }());
    exports.LeaderboardUser = LeaderboardUser;
    var TableClosed = (function () {
        function TableClosed(tableId) {
            this.tableId = tableId;
        }
        return TableClosed;
    }());
    exports.TableClosed = TableClosed;
    var SetTableOptionResult = (function () {
        function SetTableOptionResult() {
        }
        return SetTableOptionResult;
    }());
    exports.SetTableOptionResult = SetTableOptionResult;
    var CashOutRequestResult = (function () {
        function CashOutRequestResult() {
            this.accounts = [];
        }
        return CashOutRequestResult;
    }());
    exports.CashOutRequestResult = CashOutRequestResult;
    var CashOutAccount = (function () {
        function CashOutAccount() {
        }
        return CashOutAccount;
    }());
    exports.CashOutAccount = CashOutAccount;
    var TxFee = (function () {
        function TxFee(obj) {
            if (obj === void 0) { obj = {}; }
            var _a = obj.currency, currency = _a === void 0 ? '' : _a, _b = obj.amount, amount = _b === void 0 ? 0 : _b;
            this.currency = currency;
            this.amount = amount;
        }
        TxFee.DashFeeDefault = 2000;
        return TxFee;
    }());
    exports.TxFee = TxFee;
    var UserData = (function () {
        function UserData() {
            this.accounts = [];
        }
        return UserData;
    }());
    exports.UserData = UserData;
    var Version = (function () {
        function Version(version, appName, appSupportEmail, cdn) {
            this.version = version;
            this.appName = appName;
            this.appSupportEmail = appSupportEmail;
            this.cdn = cdn;
        }
        return Version;
    }());
    exports.Version = Version;
    var GlobalChatResult = (function () {
        function GlobalChatResult() {
            this.messages = [];
        }
        return GlobalChatResult;
    }());
    exports.GlobalChatResult = GlobalChatResult;
    var TableConfigs = (function () {
        function TableConfigs() {
        }
        return TableConfigs;
    }());
    exports.TableConfigs = TableConfigs;
    var GlobalUsers = (function () {
        function GlobalUsers() {
            this.users = [];
        }
        return GlobalUsers;
    }());
    exports.GlobalUsers = GlobalUsers;
    var UserStatus = (function () {
        function UserStatus(screenName, online, countryCode, country) {
            this.screenName = screenName;
            this.online = online;
            this.countryCode = countryCode;
            this.country = country;
        }
        return UserStatus;
    }());
    exports.UserStatus = UserStatus;
    var ChatMessageResult = (function () {
        function ChatMessageResult() {
            this.messages = [];
        }
        return ChatMessageResult;
    }());
    exports.ChatMessageResult = ChatMessageResult;
    var ChatMessage = (function () {
        function ChatMessage() {
        }
        return ChatMessage;
    }());
    exports.ChatMessage = ChatMessage;
    var PokerError = (function () {
        function PokerError(message) {
            this.message = message;
        }
        return PokerError;
    }());
    exports.PokerError = PokerError;
    var FundAccountResult = (function () {
        function FundAccountResult() {
        }
        return FundAccountResult;
    }());
    exports.FundAccountResult = FundAccountResult;
    var AccountFunded = (function () {
        function AccountFunded() {
        }
        return AccountFunded;
    }());
    exports.AccountFunded = AccountFunded;
    var AccountWithdrawlResult = (function () {
        function AccountWithdrawlResult() {
            this.success = false;
        }
        return AccountWithdrawlResult;
    }());
    exports.AccountWithdrawlResult = AccountWithdrawlResult;
    var TableSeatEvents = (function () {
        function TableSeatEvents(tableId) {
            this.tableId = tableId;
            this.seats = [];
        }
        return TableSeatEvents;
    }());
    exports.TableSeatEvents = TableSeatEvents;
    var TableSeatEvent = (function () {
        function TableSeatEvent() {
        }
        return TableSeatEvent;
    }());
    exports.TableSeatEvent = TableSeatEvent;
    var DealHoleCardsEvent = (function () {
        function DealHoleCardsEvent(tableId) {
            this.tableId = tableId;
        }
        return DealHoleCardsEvent;
    }());
    exports.DealHoleCardsEvent = DealHoleCardsEvent;
    var GameStartingEvent = (function () {
        function GameStartingEvent(tableId) {
            this.tableId = tableId;
        }
        return GameStartingEvent;
    }());
    exports.GameStartingEvent = GameStartingEvent;
    var BlindsChangingEvent = (function () {
        function BlindsChangingEvent(smallBlind, bigBlind) {
            this.smallBlind = smallBlind;
            this.bigBlind = bigBlind;
        }
        return BlindsChangingEvent;
    }());
    exports.BlindsChangingEvent = BlindsChangingEvent;
    var GameEvent = (function () {
        function GameEvent(tableId) {
            this.tableId = tableId;
            this.pot = [];
        }
        return GameEvent;
    }());
    exports.GameEvent = GameEvent;
    var PotResult = (function () {
        function PotResult() {
            this.seatWinners = [];
        }
        return PotResult;
    }());
    exports.PotResult = PotResult;
    var SubscribeTableResult = (function () {
        function SubscribeTableResult() {
        }
        return SubscribeTableResult;
    }());
    exports.SubscribeTableResult = SubscribeTableResult;
    var Account = (function () {
        function Account(currency, balance) {
            this.currency = currency;
            this.balance = balance;
        }
        return Account;
    }());
    exports.Account = Account;
    var GetAccountSettingsResult = (function () {
        function GetAccountSettingsResult() {
        }
        return GetAccountSettingsResult;
    }());
    exports.GetAccountSettingsResult = GetAccountSettingsResult;
    var SetAccountSettingsResult = (function () {
        function SetAccountSettingsResult(success, errorMessage) {
            this.success = success;
            this.errorMessage = errorMessage;
        }
        return SetAccountSettingsResult;
    }());
    exports.SetAccountSettingsResult = SetAccountSettingsResult;
    var TournamentSubscriptionResult = (function () {
        function TournamentSubscriptionResult() {
            this.tournaments = [];
        }
        return TournamentSubscriptionResult;
    }());
    exports.TournamentSubscriptionResult = TournamentSubscriptionResult;
});



define('shared/Currency',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Currency = (function () {
        function Currency() {
        }
        Currency.free = 'usd';
        Currency.dash = 'dash';
        Currency.bcy = 'bcy';
        Currency.eth = 'eth';
        Currency.beth = 'beth';
        Currency.btc = 'btc';
        Currency.tournament = 'tournament';
        Currency.freeStartingAmount = 100000;
        return Currency;
    }());
    exports.Currency = Currency;
    var CurrencyUnit = (function () {
        function CurrencyUnit() {
        }
        CurrencyUnit.getCurrencyUnit = function (currency) {
            if (currency === Currency.free)
                return CurrencyUnit.free;
            else if (currency === Currency.tournament)
                return 1;
            else
                return 100000000;
        };
        CurrencyUnit.free = 100;
        CurrencyUnit.dash = 100000000;
        CurrencyUnit.bcy = 100000000;
        CurrencyUnit.eth = 100000000;
        CurrencyUnit.btc = 100000000;
        CurrencyUnit.default = 100000000;
        return CurrencyUnit;
    }());
    exports.CurrencyUnit = CurrencyUnit;
});



define('shared/CommonHelpers',["require", "exports", "./Currency"], function (require, exports, Currency_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CommonHelpers = (function () {
        function CommonHelpers() {
        }
        CommonHelpers.allowAutoFold = function (guid, currentPlayers) {
            var result = { allowAutoFold: false, allowAutoCheck: false, autoFoldButtonText: '' };
            var playerNextToAct = currentPlayers.find(function (s) { return s.myturn; });
            var currentPlayer = currentPlayers.find(function (p) { return p.guid === guid; });
            if (playerNextToAct && currentPlayer && currentPlayer.playing && !currentPlayer.myturn && !currentPlayer.hasFolded) {
                var betAmounts = currentPlayers.map(function (s) { return s.bet; });
                var maxBet = Math.max.apply(null, betAmounts);
                result.allowAutoFold = true;
                var hasCalledOrRaised = currentPlayer.hasCalled || currentPlayer.hasRaised;
                if (currentPlayer.bet == maxBet && !hasCalledOrRaised) {
                    result.allowAutoCheck = true;
                }
                if (hasCalledOrRaised && currentPlayer.bet == maxBet)
                    result.autoFoldButtonText = 'Fold any Raise';
                else
                    result.autoFoldButtonText = maxBet > 0 && currentPlayer.bet < maxBet ? 'Fold' : 'Check/Fold';
            }
            return result;
        };
        CommonHelpers.getTxHashLink = function (txHash, currency) {
            if (currency == Currency_1.Currency.dash) {
                return "https://chainz.cryptoid.info/dash/tx.dws?" + txHash + ".htm";
            }
            else if (currency == Currency_1.Currency.eth || currency == 'ukg' || currency == 'chp') {
                return "https://etherscan.io/tx/" + txHash;
            }
            else if (currency == Currency_1.Currency.btc) {
                return "https://www.blockchain.com/btc/tx/" + txHash;
            }
            return txHash;
        };
        return CommonHelpers;
    }());
    exports.CommonHelpers = CommonHelpers;
    function to(promise) {
        return promise.then(function (data) {
            return [null, data];
        })
            .catch(function (err) { return [err]; });
    }
    exports.default = to;
    function getCardSuit(card) {
        var suit = '';
        if (card === 'S')
            suit = '♠';
        else if (card === 'C')
            suit = '♣';
        else if (card === 'H')
            suit = '♥';
        else if (card === 'D')
            suit = '♦';
        else
            throw new Error('invalid lastChar:' + card);
        return suit;
    }
    exports.getCardSuit = getCardSuit;
    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    exports.isNumeric = isNumeric;
    function numberWithCommas(x) {
        if (isNumeric(x))
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return '';
    }
    exports.numberWithCommas = numberWithCommas;
    function ordinal_suffix_of(i) {
        var j = i % 10, k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    }
    exports.ordinal_suffix_of = ordinal_suffix_of;
});



define('shared/ClientMessage',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ClientMessage = (function () {
        function ClientMessage() {
        }
        return ClientMessage;
    }());
    exports.ClientMessage = ClientMessage;
    var PaymentHistoryRequest = (function () {
        function PaymentHistoryRequest() {
        }
        PaymentHistoryRequest.prototype.getFieldName = function () {
            return 'paymentHistoryRequest';
        };
        return PaymentHistoryRequest;
    }());
    exports.PaymentHistoryRequest = PaymentHistoryRequest;
    var ExchangeRatesRequest = (function () {
        function ExchangeRatesRequest() {
        }
        ExchangeRatesRequest.prototype.getFieldName = function () {
            return 'exchangeRatesRequest';
        };
        return ExchangeRatesRequest;
    }());
    exports.ExchangeRatesRequest = ExchangeRatesRequest;
    var CashOutRequest = (function () {
        function CashOutRequest() {
        }
        CashOutRequest.prototype.getFieldName = function () {
            return 'cashOutRequest';
        };
        return CashOutRequest;
    }());
    exports.CashOutRequest = CashOutRequest;
    var RebuyRequest = (function () {
        function RebuyRequest(tournamentId) {
            this.tournamentId = tournamentId;
        }
        RebuyRequest.prototype.getFieldName = function () {
            return 'rebuyRequest';
        };
        return RebuyRequest;
    }());
    exports.RebuyRequest = RebuyRequest;
    var FoldRequest = (function () {
        function FoldRequest() {
        }
        return FoldRequest;
    }());
    exports.FoldRequest = FoldRequest;
    var BetRequest = (function () {
        function BetRequest() {
        }
        return BetRequest;
    }());
    exports.BetRequest = BetRequest;
    var FundAccountRequest = (function () {
        function FundAccountRequest(currency) {
            this.currency = currency;
        }
        FundAccountRequest.prototype.getFieldName = function () {
            return 'fundAccountRequest';
        };
        return FundAccountRequest;
    }());
    exports.FundAccountRequest = FundAccountRequest;
    var AccountWithdrawlRequest = (function () {
        function AccountWithdrawlRequest() {
        }
        AccountWithdrawlRequest.prototype.getFieldName = function () {
            return 'accountWithdrawlRequest';
        };
        return AccountWithdrawlRequest;
    }());
    exports.AccountWithdrawlRequest = AccountWithdrawlRequest;
    var GetAccountSettingsRequest = (function () {
        function GetAccountSettingsRequest() {
        }
        return GetAccountSettingsRequest;
    }());
    exports.GetAccountSettingsRequest = GetAccountSettingsRequest;
    var SetAccountSettingsRequest = (function () {
        function SetAccountSettingsRequest() {
        }
        return SetAccountSettingsRequest;
    }());
    exports.SetAccountSettingsRequest = SetAccountSettingsRequest;
    var TransferFundsRequest = (function () {
        function TransferFundsRequest() {
        }
        return TransferFundsRequest;
    }());
    exports.TransferFundsRequest = TransferFundsRequest;
    var SubscribeToTableRequest = (function () {
        function SubscribeToTableRequest() {
        }
        SubscribeToTableRequest.prototype.getFieldName = function () {
            return 'subscribeToTableRequest';
        };
        return SubscribeToTableRequest;
    }());
    exports.SubscribeToTableRequest = SubscribeToTableRequest;
    var TournamentSubscriptionRequest = (function () {
        function TournamentSubscriptionRequest() {
        }
        TournamentSubscriptionRequest.prototype.getFieldName = function () {
            return 'tournamentSubscriptionRequest';
        };
        return TournamentSubscriptionRequest;
    }());
    exports.TournamentSubscriptionRequest = TournamentSubscriptionRequest;
    var TournamentRegisterRequest = (function () {
        function TournamentRegisterRequest(id) {
            this.tournamentId = id;
        }
        TournamentRegisterRequest.prototype.getFieldName = function () {
            return 'tournamentRegisterRequest';
        };
        return TournamentRegisterRequest;
    }());
    exports.TournamentRegisterRequest = TournamentRegisterRequest;
    var GlobalChatRequest = (function () {
        function GlobalChatRequest(message, initialData) {
            this.message = message;
            this.initialData = initialData;
        }
        GlobalChatRequest.prototype.getFieldName = function () {
            return 'globalChatRequest';
        };
        return GlobalChatRequest;
    }());
    exports.GlobalChatRequest = GlobalChatRequest;
    var Ping = (function () {
        function Ping() {
        }
        Ping.prototype.getFieldName = function () {
            return 'ping';
        };
        return Ping;
    }());
    exports.Ping = Ping;
    var ListTablesRequest = (function () {
        function ListTablesRequest() {
        }
        ListTablesRequest.prototype.getFieldName = function () {
            return 'listTablesRequest';
        };
        return ListTablesRequest;
    }());
    exports.ListTablesRequest = ListTablesRequest;
    var JoinTableRequest = (function () {
        function JoinTableRequest() {
        }
        JoinTableRequest.prototype.getFieldName = function () {
            return 'joinTableRequest';
        };
        return JoinTableRequest;
    }());
    exports.JoinTableRequest = JoinTableRequest;
    var LeaveTableRequest = (function () {
        function LeaveTableRequest(tableId) {
            this.tableId = tableId;
        }
        LeaveTableRequest.prototype.getFieldName = function () {
            return 'leaveTableRequest';
        };
        return LeaveTableRequest;
    }());
    exports.LeaveTableRequest = LeaveTableRequest;
    var SetTableOptionRequest = (function () {
        function SetTableOptionRequest(tableId, sitOutNextHand, autoFold, autoCheck) {
            this.tableId = tableId;
            this.sitOutNextHand = sitOutNextHand;
            this.autoFold = autoFold;
            this.autoCheck = autoCheck;
        }
        SetTableOptionRequest.prototype.getFieldName = function () {
            return 'setTableOptionRequest';
        };
        return SetTableOptionRequest;
    }());
    exports.SetTableOptionRequest = SetTableOptionRequest;
    var ChatRequest = (function () {
        function ChatRequest(tableId, message) {
            this.tableId = tableId;
            this.message = message;
        }
        ChatRequest.prototype.getFieldName = function () {
            return 'chatRequest';
        };
        return ChatRequest;
    }());
    exports.ChatRequest = ChatRequest;
});



define('shared/AutoOptionResult',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('seat',["require", "exports", "aurelia-framework", "./messages", "jquery"], function (require, exports, aurelia_framework_1, messages_1, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Seat = (function () {
        function Seat(ea, util, constants, seatIndex, apiService) {
            var _this = this;
            this.ea = ea;
            this.util = util;
            this.constants = constants;
            this.apiService = apiService;
            this.width = 106;
            this.height = 81;
            this.chips = [];
            this.facedownCard = 'Red_Back';
            this.isHovering = false;
            this.timeLeft = 0;
            this.seatIndex = seatIndex;
            this.init();
            this.loadSoundsHandler = function () {
                _this.loadSounds();
            };
        }
        Seat.prototype.init = function () {
            this.name = '';
            this.bet = 0;
            this.empty = true;
            this.canSit = false;
            this.stack = 0;
            this.playing = false;
            this.myturn = false;
            this.chips = [];
            this.guid = '';
            this.playercards = null;
            this.hasFolded = false;
            this.hasRaised = false;
            this.hasCalled = false;
            this.isSittingOut = false;
            this.faceupCard1 = null;
            this.faceupCard2 = null;
            this.playerMyTurn = false;
            this.stopMyTurnAnimations();
            this.avatar = null;
        };
        Object.defineProperty(Seat.prototype, "action", {
            get: function () {
                var text = '';
                if (this.isSittingOut) {
                    text = 'Sitting Out';
                }
                else if (this.hasFolded) {
                    text = 'Fold';
                }
                else if (this.stack === 0 && this.playing)
                    text = 'All in';
                else if (this.hasRaised || this.hasCalled) {
                    text = this.bet === 0 ? "Check" : (this.hasRaised ? 'Raise' : 'Call');
                }
                return text;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Seat.prototype, "ownCardsVisible", {
            get: function () {
                return this.playing && this.faceupCard1 && (!this.hasFolded || this.isHovering);
            },
            enumerable: true,
            configurable: true
        });
        Seat.prototype.attached = function () {
            this.pLeft = $(this.seatElem).css('left');
            this.pTop = $(this.seatElem).css('top');
            var that = this;
            this.seatElem.addEventListener('click', this.loadSoundsHandler);
        };
        Seat.prototype.detached = function () {
            this.stopMyTurnAnimations();
            var that = this;
            this.seatElem.removeEventListener('click', this.loadSoundsHandler);
        };
        Seat.prototype.loadSounds = function () {
            this.apiService.loadSounds();
        };
        Seat.prototype.sit = function () {
            if (this.canSit)
                this.ea.publish(new messages_1.SitDownAction(this.seatIndex));
        };
        Seat.prototype.setHoleCards = function () {
            if (this.playercards && this.playercards.length > 0) {
                this.faceupCard1 = "sprite sprite-" + this.playercards[0] + "-150";
                this.faceupCard2 = "sprite sprite-" + this.playercards[1] + "-150";
            }
            else {
                this.faceupCard1 = '';
                this.faceupCard2 = '';
            }
        };
        Seat.prototype.setChips = function () {
            this.chips = this.util.getChips(this.seatIndex, this.bet, this.playerChips, this);
        };
        Seat.prototype.chipsToPlayer = function () {
            $('.chip').animate({ 'left': this.pLeft, 'top': this.pTop }, 600, function () { $('.chip').remove(); });
        };
        Seat.prototype.playerChips = function (playernum, stacknum, chipnum, quantity) {
            var p0 = this.constants.p0;
            var p1 = this.constants.p1;
            var p2 = this.constants.p2;
            var p3 = this.constants.p3;
            var p4 = this.constants.p4;
            var p5 = this.constants.p5;
            var p6 = this.constants.p6;
            var p7 = this.constants.p7;
            var p8 = this.constants.p8;
            var players = Array(p0, p1, p2, p3, p4, p5, p6, p7, p8);
            var player = players[playernum];
            var bottom_chip = player[stacknum];
            var chips = [];
            for (var i = 0; i < quantity; i++) {
                var top = bottom_chip[1] - (2 * i);
                chips.push(this.util.getChip(chipnum, bottom_chip[0], top, undefined));
            }
            return chips;
        };
        Seat.prototype.deal = function () {
            var $seat = $(this.seatElem);
            this.util.dealCard(this.facedownCard, this.pLeft, this.pTop, this.constants.dealwidth, $seat.width(), $, 250, this.constants.origin, null);
        };
        Seat.prototype.returnCards = function () {
            var _this = this;
            this.returnCard();
            setTimeout(function () {
                _this.returnCard();
            }, 100);
        };
        Seat.prototype.returnCard = function () {
            var $seat = $(this.seatElem);
            var dealerLeft = this.constants.origin[1];
            var dealerTop = this.constants.origin[0];
            var cardOrigin = [this.pTop, this.pLeft];
            this.util.dealCard(this.facedownCard, dealerLeft, dealerTop, $seat.width(), this.constants.dealwidth, $, 250, cardOrigin, null);
        };
        Seat.prototype.checkChanges = function (seat) {
            if (this.hasFolded === false && seat.hasFolded) {
                this.returnCards();
            }
            if (seat.hasFolded) {
            }
            if (!this.myturn && seat.myturn) {
                this.startTimer();
            }
            else {
                this.stopMyTurnAnimations();
            }
        };
        Seat.prototype.stopMyTurnAnimations = function () {
            this.timeToActSec = null;
            if (this.timerElem) {
                this.timerElem.remove();
            }
            if (this.flashingTurnTimer) {
                window.clearInterval(this.flashingTurnTimer);
                this.playerMyTurn = false;
                this.timeLeft = 0;
            }
        };
        Seat.prototype.startTimer = function () {
            var _this = this;
            this.flashingTurnTimer = window.setInterval(function () {
                _this.playerMyTurn = !_this.playerMyTurn;
                var msSinceStarted = (new Date().getTime() - _this.startTime.getTime());
                var startingIn = _this.getTimeToActSec() * 1000 - msSinceStarted;
                var remaining = Math.round(startingIn / 1000);
                _this.timeLeft = remaining >= 0 ? remaining : 0;
            }, 300);
            if (this.getTimeToActSec()) {
                this.startTime = new Date();
            }
        };
        Seat.prototype.getTimeToActSec = function () {
            return this.timeToActSec || this.util.currentTableConfig.timeToActSec;
        };
        __decorate([
            aurelia_framework_1.computedFrom('hasFolded', 'hasRaised', 'hasCalled', 'isSittingOut', 'playing', 'bet'),
            __metadata("design:type", String),
            __metadata("design:paramtypes", [])
        ], Seat.prototype, "action", null);
        __decorate([
            aurelia_framework_1.computedFrom('playing', 'faceupCard1', 'hasFolded', 'isHovering'),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [])
        ], Seat.prototype, "ownCardsVisible", null);
        return Seat;
    }());
    exports.Seat = Seat;
});



define('text!seat.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./lib/number-format\"></require>\n  <style if.bind=\"!empty && avatar\">\n    .player-sitting-inner-${seatIndex}:before {\n      background: url(${avatar}) rgb(97, 111, 145) no-repeat;\n      background-size: cover;\n    }\n  </style>\n  \n\n  <div mouseover.delegate=\"isHovering=true\" mouseout.delegate=\"isHovering=false\" id=\"seat-${seatIndex}\" click.trigger=\"sit()\" class=\"player-info ${empty ? 'empty-seat' : 'player-sitting'} ${canSit ? 'can-sit' : ''} ${playerMyTurn ? 'player-my-turn' : ''}\" ref=\"seatElem\" >  \n  <div class=\"timer\" show.bind=\"myturn && timeLeft\">${timeLeft}</div>\n    <div class=\"${empty ? '' : 'player-sitting-inner'} ${isSittingOut || hasFolded ? 'player-sitting-inner-grayscale' : ''} player-sitting-inner-${seatIndex}\">\n      <div class=\"action ${isSittingOut || hasFolded ? 'grayscale' : ''}\" id=\"seat${seatIndex}action\" show.bind=\"action\">${action}</div>\n      <div class=\"facedown down0\">\n        <div class=\"sprite sprite-Red_Back-150\" if.bind=\"playing && !hasFolded && !guid && !faceupCard1\"></div>\n      </div>\n      <div class=\"facedown down1\">\n        <div class=\"sprite sprite-Red_Back-150\" if.bind=\"playing && !hasFolded && !guid && !faceupCard2\"></div>\n      </div>\n      <div class=\"player-seat-info-box player-status ${isSittingOut || hasFolded ? 'grayscale' : ''}\" show.bind=\"!empty && !ownCardsVisible\">\n        <span class=\"player-name\">${name}</span><br><span class=\"player-amount\">${stack | numberFormat}</span>\n      </div>\n      <div class=\"player-seat-info-box player-own-stack\" show.bind=\"!empty && ownCardsVisible\">\n        <span class=\"player-amount\">${stack | numberFormat}</span>\n      </div>\n      <div id=\"seat${seatIndex}card0\" class=\"faceup card0\">\n        <div class=\"${faceupCard1}\" show.bind=\"playing && faceupCard1 && (!hasFolded || isHovering)\"></div>      \n      </div>\n      <div id=\"seat${seatIndex}card1\" class=\"faceup card1\">\n        <div class=\"${faceupCard2}\" show.bind=\"playing && faceupCard2 && (!hasFolded || isHovering)\"></div>      \n      </div>\n      <div show.bind=\"canSit\" class=\"invitation\">Sit Down</div>\n\n    </div>\n  </div>\n\n  <div class=\"stack-label\" id=\"stack${seatIndex}\">\n    <span show.bind=\"bet\" id=\"stack${seatIndex}span\">${bet | numberFormat}</span>\n  </div>\n  \n<div repeat.for=\"chip of chips\" class=\"${chip.classes}\" css=\"top: ${chip.top}px; left: ${chip.left}px;\"></div>\n\n</template>\n"; });
define('resources/index',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function configure(config) {
    }
    exports.configure = configure;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('resources/attributes/visibility-custom-attribute',["require", "exports", "aurelia-framework"], function (require, exports, aurelia_framework_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var VisibilityCustomAttribute = (function () {
        function VisibilityCustomAttribute(element) {
            this.element = element;
            this.element = element;
        }
        VisibilityCustomAttribute.prototype.valueChanged = function (newValue) {
            this.element.style.visibility = newValue ? 'visible' : 'hidden';
        };
        VisibilityCustomAttribute = __decorate([
            aurelia_framework_1.inject(Element),
            __metadata("design:paramtypes", [HTMLElement])
        ], VisibilityCustomAttribute);
        return VisibilityCustomAttribute;
    }());
    exports.VisibilityCustomAttribute = VisibilityCustomAttribute;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define('reset-password-form',["require", "exports", "./lib/api-service", "aurelia-event-aggregator", "aurelia-router", "aurelia-framework", "./shared/reset-result", "./lib/utility"], function (require, exports, api_service_1, aurelia_event_aggregator_1, aurelia_router_1, aurelia_framework_1, reset_result_1, utility) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Reset = (function () {
        function Reset(apiService, router, ea) {
            this.apiService = apiService;
            this.router = router;
            this.ea = ea;
            this.loading = true;
        }
        Reset.prototype.attached = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4, this.apiService.reset(this.getResetRequest())];
                        case 1:
                            _a.result = _b.sent();
                            this.loading = false;
                            return [2];
                    }
                });
            });
        };
        Reset.prototype.reset = function () {
            return __awaiter(this, void 0, void 0, function () {
                var resetPasswordResult;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.submitting = true;
                            this.result.errors = [];
                            return [4, this.apiService.resetPassword(this.getResetRequest())];
                        case 1:
                            resetPasswordResult = _a.sent();
                            this.submitting = false;
                            if (resetPasswordResult.success) {
                                this.resetPasswordSuccess = true;
                                localStorage.setItem("sid", resetPasswordResult.sid);
                                setTimeout(function () {
                                    window.location.href = '/';
                                }, 1500);
                            }
                            else {
                                this.result.errors = resetPasswordResult.errors;
                            }
                            return [2];
                    }
                });
            });
        };
        Reset.prototype.getResetRequest = function () {
            var request = new reset_result_1.ResetRequest();
            request.token = utility.getParameterByName('token');
            request.password = this.password;
            request.confirm = this.confirm;
            return request;
        };
        Reset.prototype.navigateToForgot = function () {
            window.location.href = '/#/forgot';
        };
        Reset = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService, aurelia_router_1.Router, aurelia_event_aggregator_1.EventAggregator])
        ], Reset);
        return Reset;
    }());
    exports.Reset = Reset;
});



define('text!reset-password-form.html', ['module'], function(module) { module.exports = "<template>\n   \n\n      <div class=\"container\" style=\"padding: 100px 0;\">\n          <div class=\"row\">\n\n            <div class=\"text-center\">\n\n\n              \n        \n              <div class=\"form-group\" show.bind=\"result && !result.success\">\n                <div class=\"alert alert-dismissible alert-danger\" >\n                  <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\n                  \n                  <p repeat.for=\"error of result.errors\">${error}</p>\n                </div>\n                <p><a route-href=\"route: home\" class=\"btn btn-primary\"><strong> Forgot my password</strong></a></p>\n              </div>\n\n            <div class=\"col-sm-6 col-sm-offset-3\" show.bind=\"result.success\">\n              <div class=\"page-header\">\n                <h1>Reset Your Password</h1>\n              </div>\n              <form submit.delegate=\"reset()\">\n                <div class=\"form-group\">\n                  <label for=\"password\" class=\"sr-only\">New Password:</label>\n                  <input type=\"password\" name=\"password\" id=\"password\" placeholder=\"New password\" autocomplete=\"off\" autofocus=\"\" required=\"\" pattern=\"^[^S]{4,}\" title=\"At least 4 characters!\" class=\"form-control\" value.bind=\"password\">\n                  <div class=\"progress\" style=\"display: none;\">\n                    <div role=\"progressbar\" class=\"progress-bar\"></div>\n                  </div>\n                </div>\n                <div class=\"form-group\">\n                  <label for=\"confirm\" class=\"sr-only\">Confirm Password:</label>\n                  <input type=\"password\" name=\"confirm\" placeholder=\"Confirm your new password\" autocomplete=\"off\" required=\"\" pattern=\"^[^S]{4,}\" title=\"At least 4 characters!\" class=\"form-control\" value.bind=\"confirm\">\n                </div>\n                <div class=\"form-group\">                  \n                  <button type=\"submit\" class=\"btn btn-primary\" disabled.bind=\"submitting || resetPasswordSuccess\"><i class=\"fa ${submitting ? 'fa-spinner fa-spin': 'fa-lock'}\"></i></i>&nbsp;Reset Password</button>&nbsp;\n                </div>\n\n                <div class=\"form-group\">\n                  <div class=\"alert alert-dismissible alert-danger\" show.bind=\"result.errors.length\">\n                    <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\n                    \n                    <p repeat.for=\"error of result.errors\">${error}</p>\n                  </div>\n                </div>\n\n                <div class=\"alert alert-dismissible alert-success\" show.bind=\"resetPasswordSuccess\">                  \n                  <p>Your password has been changed!</p>\n                  <p>Redirecting to Dashboard...<i class=\"fa fa-spinner fa-spin\"></i></p>\n                </div>\n\n\n              </form>\n              <hr>\n              <p>Need to try again?<a route-href=\"route: home\"><strong> Forgot my password</strong></a></p>\n            </div>\n            \n            <div show.bind=\"loading\">Please wait...<i class=\"fa fa-spinner fa-spin\"></i></div>\n            \n\n          \n            </div>\n          </div>\n        </div>\n\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('register-tournament-popup',["require", "exports", "aurelia-framework", "aurelia-dialog", "./messages", "aurelia-event-aggregator", "./funding-window", "./shared/TableViewRow", "decimal.js"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, messages_1, aurelia_event_aggregator_1, funding_window_1, TableViewRow_1, decimal_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RegisterTournamentPopup = (function () {
        function RegisterTournamentPopup(controller, ea) {
            this.controller = controller;
            this.ea = ea;
        }
        RegisterTournamentPopup.prototype.activate = function (model) {
            this.view = model;
            this.housePrize = new decimal_js_1.default(model.tournament.totalPrize).minus(new decimal_js_1.default(model.tournament.buyIn).mul(model.tournament.playerCount)).toNumber();
        };
        RegisterTournamentPopup.prototype.openDepositWindow = function () {
            var model = new funding_window_1.FundingWindowModel();
            model.tableConfig = new TableViewRow_1.TableViewRow();
            model.tableConfig.currency = this.view.tournament.currency;
            this.ea.publish(new messages_1.DepositNowEvent(model));
            this.controller.cancel();
        };
        RegisterTournamentPopup.prototype.registerForTournament = function () {
            this.controller.ok();
        };
        RegisterTournamentPopup = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, aurelia_event_aggregator_1.EventAggregator])
        ], RegisterTournamentPopup);
        return RegisterTournamentPopup;
    }());
    exports.RegisterTournamentPopup = RegisterTournamentPopup;
    var RegisterTournamentPopupViewModel = (function () {
        function RegisterTournamentPopupViewModel() {
        }
        return RegisterTournamentPopupViewModel;
    }());
    exports.RegisterTournamentPopupViewModel = RegisterTournamentPopupViewModel;
});



define('text!register-tournament-popup.html', ['module'], function(module) { module.exports = "<template>\n  <ux-dialog>    \n    <ux-dialog-body>\n      \n      <h3>${view.tournament.name} <i class=\"fa fa-trophy\" aria-hidden=\"true\"></i></h3>      \n      \n      <div >\n        <p class=\"alert alert-info\">\n          Your buy in amount is added to the prize total. <span show.bind=\"housePrize\">The House contributes ${housePrize}\n              <span class=\"uppercase\">${view.tournament.currency}</span>\n              <i class=\"currency-icon currency-${view.tournament.currency}\"></i>\n        </span>\n        </p>\n        <p class=\"alert alert-danger\" show.bind=\"!view.isFunded\">\n          You do not have sufficient funds to register for this tournament. \n          <p>The tournament buy in is ${view.tournament.buyIn} <span class=\"uppercase\">${view.tournament.currency}</span>\n          <i class=\"currency-icon currency-${view.tournament.currency}\"></i>\n        \n            <button click.trigger=\"openDepositWindow()\" class=\"btn btn-info\" show.bind=\"!view.isFunded\">Deposit Now!<i class=\"fa fa-money\"></i></button>            \n        </p>\n          <!-- <p show.bind=\"view.isFunded\" style=\"float:right;\">\n            <button click.trigger=\"registerForTournament()\" class=\"btn btn-secondary\"> Register for Tournament <i class=\"fa fa-trophy\"></i></button>\n          </p> -->\n        </p>\n      </div>\n     \n\n      <div style=\"margin-top: 20px;\">\n        <span click.trigger=\"controller.cancel()\" class=\"options-btn\">Close</span>\n        <button click.trigger=\"registerForTournament()\" class=\"options-btn\" style=\"float:right;color:white;background-color: red;\"\n            show.bind=\"view.isFunded\"><i class=\"fa fa-plus\"></i>  Register Now</button>\n    </div>\n      \n    </ux-dialog-body>\n   \n  </ux-dialog>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('register-form',["require", "exports", "aurelia-framework", "aurelia-event-aggregator", "./lib/api-service", "./shared/ClientMessage", "./shared/signup-request"], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, api_service_1, ClientMessage_1, signup_request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var RegisterForm = (function () {
        function RegisterForm(ea, apiService) {
            var _this = this;
            this.ea = ea;
            this.apiService = apiService;
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(signup_request_1.RegisterResult, function (r) { return _this.handleRegisterResult(r); }));
        }
        RegisterForm.prototype.register = function () {
            this.registering = true;
            var request = new signup_request_1.RegisterRequest();
            request.email = this.email;
            request.screenName = this.screenName;
            request.password = this.password;
            request.confirmPassword = this.confirmPassword;
            request.tournamentId = this.tournamentId;
            var message = new ClientMessage_1.ClientMessage();
            message.registerRequest = request;
            this.apiService.sendMessage(message);
        };
        RegisterForm.prototype.handleRegisterResult = function (result) {
            this.registering = false;
            this.result = result;
        };
        RegisterForm.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        __decorate([
            aurelia_framework_1.bindable,
            __metadata("design:type", Object)
        ], RegisterForm.prototype, "tournamentId", void 0);
        RegisterForm = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService])
        ], RegisterForm);
        return RegisterForm;
    }());
    exports.RegisterForm = RegisterForm;
});



define('text!register-form.html', ['module'], function(module) { module.exports = "<template>\n    <form>\n\n        <div class=\"alert alert-warning\">\n          Only NEW customers should Register here. If you have signed up already please Login to join a Tournament.\n        </div>\n\n        <div class=\"form-group\">\n          <label>Email</label>\n          <input type=\"email\" class=\"form-control\" value.bind=\"email\" placeholder=\"Your email\" disabled.bind=\"registering || result.success\">\n        </div>\n\n        <div class=\"form-group\">\n          <label>Screen name</label>\n          <input type=\"text\" class=\"form-control\" value.bind=\"screenName\" placeholder=\"Your table name as seen by others\" disabled.bind=\"registering || result.success\">\n        </div>\n    \n        <div class=\"form-group\">\n          <label>Password</label>\n          <input type=\"password\" class=\"form-control\" value.bind=\"password\" placeholder=\"Your password\" disabled.bind=\"registering || result.success\">\n        </div> \n        \n        <div class=\"form-group\">\n          <label>Confirm Password</label>\n          <input type=\"password\" class=\"form-control\" value.bind=\"confirmPassword\" placeholder=\"Confirm password\" disabled.bind=\"registering || result.success\">\n        </div>\n    \n        <div class=\"alert alert-danger form-group\" show.bind=\"result.errorMessage && !registering\">\n          ${result.errorMessage}\n        </div>\n        <div class=\"alert alert-success form-group\" show.bind=\"!registering && result.success\">\n            <p>Successfully registered! Please check your email for your activation link.</p>\n          </div>\n    \n        <div class=\"form-group\">\n          <button click.trigger=\"register()\" disabled.bind=\"registering || result.success\" class=\"btn btn-primary\">Register <i class=\"fa fa-refresh fa-spin\" show.bind=\"registering\"></i></button>\n        </div>\n      </form>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('poker-table',["require", "exports", "./shared/signup-request", "aurelia-framework", "aurelia-dialog", "aurelia-event-aggregator", "./lib/api-service", "./lib/util", "./seat", "./cash-out", "./messages", "./funding-window", "./lib/constants", "jquery", "./shared/DataContainer", "./message-window", "./shared/ClientMessage", "./shared/CommonHelpers", "./environment", "./login-popup", "./shared/login-request", "aurelia-router", "./shared/decimal", "./shared/forgot-request", "./tournament-result-poup", "./shared/Currency", "./shared/TournamentInfoRequest", "./model/PotResultChatSummary", "./tournament-info-poup", "./register-tournament-popup"], function (require, exports, signup_request_1, aurelia_framework_1, aurelia_dialog_1, aurelia_event_aggregator_1, api_service_1, util_1, seat_1, cash_out_1, messages_1, funding_window_1, constants_1, $, DataContainer_1, message_window_1, ClientMessage_1, CommonHelpers_1, environment_1, login_popup_1, login_request_1, aurelia_router_1, decimal_1, forgot_request_1, tournament_result_poup_1, Currency_1, TournamentInfoRequest_1, PotResultChatSummary_1, tournament_info_poup_1, register_tournament_popup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PokerTable = (function () {
        function PokerTable(apiService, dialogService, ea, util, constants, dialogController, router) {
            var _this = this;
            this.dialogService = dialogService;
            this.ea = ea;
            this.util = util;
            this.constants = constants;
            this.dialogController = dialogController;
            this.router = router;
            this.seats = [];
            this.statusLabel = '';
            this.isLoadingTable = true;
            this.tableOptions = new DataContainer_1.SetTableOptionResult();
            this.game = new DataContainer_1.GameEvent(null);
            this.gameStarting = new DataContainer_1.GameStartingEvent(null);
            this.potChips = [];
            this.chatMessages = [];
            this.subscriptions = [];
            this.playChatSound = true;
            this.apiService = apiService;
            for (var i = 0; i < 9; i++) {
                this.seats.push(new seat_1.Seat(this.ea, util, this.constants, i, this.apiService));
            }
            this.subscriptions.push(ea.subscribe(messages_1.SitDownAction, function (msg) { _this.join(msg.seatIndex); }));
            this.subscriptions.push(ea.subscribe(messages_1.DataMessageEvent, function (msg) { _this.onMessage(msg.data); }));
            this.subscriptions.push(ea.subscribe(messages_1.OpenTableAction, function (msg) { _this.onOpenTableAction(msg.tableId); }));
            this.subscriptions.push(ea.subscribe(messages_1.ConnectionClosedEvent, function (msg) { _this.onConnectionClosed(); }));
            this.subscriptions.push(ea.subscribe(messages_1.OpenLoginPopupEvent, function (msg) { _this.openLoginWindow(msg); }));
            this.subscriptions.push(ea.subscribe(messages_1.TournamentRegisterClickEvent, function (msg) { _this.onTournamentRegisterClickEvent(msg); }));
            this.subscriptions.push(ea.subscribe(messages_1.DepositNowEvent, function (msg) { _this.openFundingWindow(msg.model); }));
        }
        PokerTable.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
            this.apiService.close();
            window.clearInterval(this.pingTimer);
        };
        PokerTable.prototype.activate = function (params, routeConfig) {
        };
        PokerTable.prototype.attached = function () {
            var _this = this;
            this.apiService.openWebSocket(function () { _this.onopen(); });
        };
        PokerTable.prototype.onTournamentRegisterClickEvent = function (event) {
            var _this = this;
            var tournament = event.tournament;
            if (tournament.registering)
                return;
            if (this.apiService.authenticated) {
                var sendRequest_1 = function () {
                    tournament.registering = true;
                    _this.apiService.send(new ClientMessage_1.TournamentRegisterRequest(tournament.id));
                };
                if (tournament.buyIn) {
                    var view = new register_tournament_popup_1.RegisterTournamentPopupViewModel();
                    var account = this.util.user.accounts.find(function (acc) { return acc.currency == tournament.currency; });
                    view.isFunded = account != null && new decimal_1.Decimal(account.balance).greaterThanOrEqualTo(new decimal_1.Decimal(tournament.buyIn).mul(Currency_1.CurrencyUnit.getCurrencyUnit(tournament.currency)));
                    view.tournament = tournament;
                    this.dialogService.open({ viewModel: register_tournament_popup_1.RegisterTournamentPopup, model: view }).whenClosed(function (response) {
                        if (!response.wasCancelled) {
                            sendRequest_1();
                        }
                    });
                }
                else {
                    sendRequest_1();
                }
            }
            else {
                var event_1 = new messages_1.OpenLoginPopupEvent(true);
                event_1.tournamentId = tournament.id;
                this.openLoginWindow(event_1);
            }
        };
        PokerTable.prototype.setLeaderboardPosition = function () {
            if (document.body.clientWidth >= 1550 && !$('#leaderboard-lhs').children().length) {
                $("#leaderboard-container").detach().appendTo("#leaderboard-lhs");
            }
            else if (document.body.clientWidth < 1550 && !$('#leaderboard-rhs').children().length) {
                $("#leaderboard-container").detach().appendTo("#leaderboard-rhs");
            }
        };
        PokerTable.prototype.onopen = function () {
            console.log("opened " + this.apiService.wsURI);
            this.wsAlive = true;
            this.isConnected = true;
        };
        PokerTable.prototype.sendPing = function () {
            var _this = this;
            if (!this.wsAlive) {
                window.clearInterval(this.pingTimer);
                console.log('no response to ping. closing connection');
                this.apiService.close();
                this.apiService.openWebSocket(function () { _this.onopen(); });
            }
            else {
                this.wsAlive = false;
                this.pingStartDate = new Date();
                this.apiService.send(new ClientMessage_1.Ping());
                this.pingTimer = window.setTimeout(function () { _this.sendPing(); }, 20000);
            }
        };
        PokerTable.prototype.handleServerPong = function () {
            this.wsAlive = true;
            this.pingTime = new Date().getTime() - this.pingStartDate.getTime();
        };
        PokerTable.prototype.onConnectionClosed = function () {
            this.isConnected = false;
            this.util.setCurrentTableId(null);
            this.util.tableConfigs = [];
            this.clear();
            this.pingTime = null;
            this.isLoadingTable = true;
            window.clearInterval(this.pingTimer);
        };
        PokerTable.prototype.clear = function () {
            this.sendingSittingBackIn = false;
            this.playerSeat = null;
            this.playerSitting = null;
            this.tableOptions = new DataContainer_1.SetTableOptionResult();
            this.seat = null;
            this.tableName = null;
            this.smallBlind = null;
            this.bigBlind = null;
            this.setStatusLabel();
            this.potChips = [];
            this.chatMessages = [];
            this.isCurrencyCrypto = false;
            this.currency = '';
            this.game = new DataContainer_1.GameEvent(null);
            this.gameStarting = new DataContainer_1.GameStartingEvent(null);
            this.potAmount = 0;
            this.playerStack = 0;
            for (var _i = 0, _a = this.seats; _i < _a.length; _i++) {
                var seat = _a[_i];
                seat.init();
            }
            this.setBettingControls();
            this.setShowAutoFold();
            this.clearBlinds();
        };
        PokerTable.prototype.clearBlinds = function () {
            window.clearInterval(this.blindsTimer);
            this.nextBlindIncrease = null;
            this.nextBlinds = null;
        };
        PokerTable.prototype.setBettingControls = function () {
            this.ea.publish(new messages_1.SetBettingControlsEvent(this.seat, this.game));
        };
        PokerTable.prototype.showWarning = function (message) {
            this.dialogService.open({ viewModel: message_window_1.MessageWindow, model: message, lock: false });
        };
        PokerTable.prototype.onOpenTableAction = function (tableId) {
            if (this.util.currentTableId === tableId) {
                this.showWarning('You are currently viewing this table!');
                return;
            }
            if (this.playerSitting) {
                this.showWarning('You are currently sitting! Please leave the table to view a different table');
                return;
            }
            this.clear();
            this.isLoadingTable = true;
            this.apiService.subscribeToTable(tableId);
        };
        PokerTable.prototype.onMessage = function (message) {
            var _this = this;
            if (message.subscribeTableResult) {
                this.clear();
            }
            var handlers = [
                { key: 'version', handler: this.handleVersion },
                { key: 'user', handler: function (data) { _this.handleUser(message); } },
                { key: 'tableConfigs', handler: this.tableConfigsHandler },
                { key: 'subscribeTableResult', handler: this.handleSubscribeTableResult },
                { key: 'game', handler: this.handleGame },
                { key: 'tableSeatEvents', handler: this.handleSeats },
                { key: 'deal', handler: this.handleDeal },
                { key: 'chatMessageResult', handler: this.handleChat },
                { key: 'fundAccountResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.FundAccountResult(), data)); } },
                { key: 'globalChatResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.GlobalChatResult(), data)); } },
                { key: 'globalUsers', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.GlobalUsers(), data)); } },
                { key: 'accountFunded', handler: this.handleAccountFunded },
                { key: 'gameStarting', handler: this.handleGameStarting },
                { key: 'accountWithdrawlResult', handler: this.handleAccountWithdrawlResult },
                { key: 'cashOutRequestResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.CashOutRequestResult(), data)); } },
                { key: 'setTableOptionResult', handler: this.handleSetTableOptionResult },
                { key: 'error', handler: this.handleError },
                { key: 'accountSettings', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.GetAccountSettingsResult(), data)); } },
                { key: 'setAccountSettingsResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.SetAccountSettingsResult(false, ""), data)); } },
                { key: 'tableClosed', handler: this.handleTableClosed },
                { key: 'leaderboardResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.LeaderboardResult(), data)); } },
                { key: 'transferFundsResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.TransferFundsResult(), data)); } },
                { key: 'exchangeRates', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.ExchangeRateResult(), data)); } },
                { key: 'registerResult', handler: function (data) { _this.ea.publish(Object.assign(new signup_request_1.RegisterResult(), data)); } },
                { key: 'tournamentSubscriptionResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.TournamentSubscriptionResult(), data)); } },
                { key: 'loginResult', handler: this.handleLoginResult },
                { key: 'logoutResult', handler: this.handleLogout },
                { key: 'pong', handler: function (data) { _this.handleServerPong(); } },
                { key: 'forgotResult', handler: function (data) { _this.ea.publish(Object.assign(new forgot_request_1.ForgotResult(), data)); } },
                { key: 'tournamentResult', handler: function (data) { _this.handleTournamentResult(data); } },
                { key: 'paymentHistoryResult', handler: function (data) { _this.ea.publish(Object.assign(new DataContainer_1.PaymentHistoryResult(), data)); } },
                { key: 'tournamentInfoResult', handler: function (data) { _this.ea.publish(Object.assign(new TournamentInfoRequest_1.TournamentInfoResult(), data)); } },
                { key: 'duplicateIpAddress', handler: function (data) { _this.handleDuplicateIpAddress(); } },
            ];
            var handled = false;
            for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
                var handler = handlers_1[_i];
                var data = message[handler.key];
                if (data) {
                    handled = true;
                    handler.handler.call(this, data);
                }
            }
            if (!handled) {
                console.error("last message had no handler! " + JSON.stringify(message));
            }
        };
        PokerTable.prototype.handleDuplicateIpAddress = function () {
            this.router.navigate('duplicate-ip');
        };
        PokerTable.prototype.handleTournamentResult = function (view) {
            this.dialogService.open({ viewModel: tournament_result_poup_1.TournamentResultPopup, model: view, lock: false });
        };
        PokerTable.prototype.handleLoginResult = function (result) {
            if (result.success) {
                this.apiService.setAuth(result.sid);
                localStorage.setItem("sid", result.sid);
            }
            this.ea.publish(Object.assign(new login_request_1.LoginResult(), result));
        };
        PokerTable.prototype.handleVersion = function (result) {
            var priorVersion = localStorage.getItem("app_version");
            localStorage.setItem("app_version", result.version);
            if (priorVersion && priorVersion != result.version) {
                console.log("version change detected from " + priorVersion + " to " + result.version + ". Reloading page...");
                location.reload();
                return;
            }
            else {
                this.apiService.version = result;
                document.title = result.appName + " | Online Crypto Poker";
                var message = new ClientMessage_1.ClientMessage();
                message.listTablesRequest = new ClientMessage_1.ListTablesRequest();
                message.exchangeRatesRequest = new ClientMessage_1.ExchangeRatesRequest();
                message.tournamentSubscriptionRequest = new ClientMessage_1.TournamentSubscriptionRequest();
                message.globalChatRequest = new ClientMessage_1.GlobalChatRequest(undefined, true);
                this.apiService.sendMessage(message);
                if (!environment_1.default.debug) {
                    this.sendPing();
                }
                this.checkRegisterTournament();
            }
        };
        PokerTable.prototype.checkRegisterTournament = function () {
            var tournamentId = localStorage.getItem("registerForTournamentId");
            if (tournamentId) {
                console.log('registering for tournamentId', tournamentId);
                localStorage.removeItem("registerForTournamentId");
                this.apiService.send(new ClientMessage_1.TournamentRegisterRequest(tournamentId));
            }
        };
        PokerTable.prototype.handleLogout = function () {
            this.dialogService.closeAll();
            this.apiService.removeAuth();
            localStorage.removeItem("sid");
            localStorage.removeItem("subscribeTableResult");
            this.util.createCookie('guid', '', null);
            this.router.navigateToRoute('logged-out');
        };
        PokerTable.prototype.handleTableClosed = function (tableClosed) {
            if (!this.isCurrentTableId(tableClosed.tableId)) {
                return;
            }
            this.shutdownRequested = true;
            this.setStatusLabel();
            this.gameStarting.isStarting = false;
        };
        PokerTable.prototype.handleSetTableOptionResult = function (result) {
            if (!this.isCurrentTableId(result.tableId)) {
                return;
            }
            Object.assign(this.tableOptions, result);
            this.setStatusLabel();
            if (!this.tableOptions.sitOutNextHand) {
                this.sendingSittingBackIn = false;
            }
        };
        PokerTable.prototype.handleUser = function (data) {
            var userData = data.user;
            if (userData.initialData && !data.loginResult) {
                localStorage.setItem("sid", '');
            }
            if (!userData.accounts) {
                userData.accounts = [];
            }
            this.userData = userData;
            this.util.user = userData;
            this.setPlayerStack();
        };
        PokerTable.prototype.handleError = function (error) {
            this.showWarning(error.message);
            this.ea.publish(new messages_1.SetBettingControlsEvent(this.seat, this.game));
        };
        PokerTable.prototype.handleChat = function (result) {
            var _this = this;
            if (result.tableId !== this.util.currentTableId)
                return;
            if (result.initialData) {
                this.chatMessages = result.messages;
                setTimeout(function () {
                    _this.chatboxElemScrollHeight = _this.chatboxElem.scrollHeight;
                }, 250);
            }
            else {
                for (var _i = 0, _a = result.messages; _i < _a.length; _i++) {
                    var message = _a[_i];
                    this.chatMessages.push(message);
                }
                this.chatboxElemScrollHeight = this.chatboxElem.scrollHeight;
                if (!result.initialData && this.playChatSound)
                    this.util.playSound(this.apiService.audioFiles.message);
            }
        };
        PokerTable.prototype.scrollSmoothToBottom = function () {
            var div = this.chatboxElem;
            $(this.chatboxElem).animate({
                scrollTop: div.scrollHeight - div.clientHeight
            }, 500);
        };
        PokerTable.prototype.handleDeal = function (deal) {
            var _this = this;
            if (!this.isCurrentTableId(deal.tableId)) {
                return;
            }
            this.gameStarting.isStarting = false;
            if (!deal.board) {
                this.dealcards();
                this.util.playSound(this.apiService.audioFiles.deal);
            }
            if (deal.holecards) {
                if (deal.holecards.length > 0) {
                    window.setTimeout(function () {
                        var seat = _this.seats.find(function (s) { return s.seatIndex === _this.playerSeat; });
                        seat.playercards = deal.holecards;
                        seat.setHoleCards();
                    }, 500);
                }
            }
            this.handleBoardCardAnimation(deal);
        };
        PokerTable.prototype.handleBoardCardAnimation = function (deal) {
            if (deal.board) {
                var cardIndex = 0;
                var that_1 = this;
                for (var _i = 0, _a = deal.board; _i < _a.length; _i++) {
                    var card = _a[_i];
                    if (!this.game.board || this.game.board.indexOf(card) === -1) {
                        var $boardCardElem = $('#card-' + cardIndex);
                        var onAnimationComplete = function () {
                            if (!that_1.game.board || !that_1.game.board.length < deal.board.length)
                                that_1.game.board = deal.board;
                            that_1.setBettingControls();
                        };
                        this.util.dealCard(card, $boardCardElem.css('left'), $boardCardElem.css('top'), this.constants.dealwidth, $boardCardElem.width(), $, 500, this.constants.origin, onAnimationComplete);
                    }
                    cardIndex++;
                }
            }
        };
        PokerTable.prototype.dealcards = function () {
            var delay = 100;
            var seats = this.seats.filter(function (s) { return s.playing; });
            seats = seats.concat(this.seats.filter(function (s) { return s.playing; }));
            var that = this;
            for (var k = 0; k < seats.length; k++) {
                window.setTimeout(function () {
                    var seat = seats.shift();
                    seat.deal();
                }, delay * k);
            }
        };
        PokerTable.prototype.handleGameStarting = function (gameStarting) {
            var _this = this;
            if (!this.isCurrentTableId(gameStarting.tableId)) {
                return;
            }
            this.gameStarting.isStarting = gameStarting.isStarting;
            this.gameStarting.blindsChanging = gameStarting.blindsChanging;
            if (this.gameStarting.isStarting) {
                this.gameStarting.startsInNumSeconds = gameStarting.startsInNumSeconds;
                this.startTime = new Date();
                this.startingTimer = setInterval(function () {
                    _this.updateStartingIn();
                }, 200);
            }
            if (gameStarting.nextBlind) {
                this.updateFromNextBlind(gameStarting.nextBlind);
            }
            else {
                this.clearBlinds();
            }
            this.setStatusLabel();
        };
        PokerTable.prototype.updateStartingIn = function () {
            var msSinceStarted = (new Date().getTime() - this.startTime.getTime());
            var startingIn = this.gameStarting.startsInNumSeconds * 1000 - msSinceStarted;
            startingIn = Math.round(startingIn / 1000);
            if (startingIn > 0) {
                this.startingIn = startingIn;
            }
            else {
                clearTimeout(this.startingTimer);
            }
        };
        PokerTable.prototype.appendWinningHandToChat = function (potResults) {
            var chatMesage = new DataContainer_1.ChatMessage();
            chatMesage.screenName = 'Dealer';
            var arr = [];
            for (var _i = 0, potResults_1 = potResults; _i < potResults_1.length; _i++) {
                var potResult = potResults_1[_i];
                var potResultChatSummary = new PotResultChatSummary_1.PotResultChatSummary();
                potResultChatSummary.text = this.getPotWinnerSummary(potResult);
                if (potResult.bestHandCards && potResult.bestHandCards.length) {
                    potResultChatSummary.cards = this.getCards(potResult.bestHandCards);
                }
                arr.push(potResultChatSummary);
            }
            chatMesage.potResultChatSummaries = arr;
            var chatMessageResult = new DataContainer_1.ChatMessageResult();
            chatMessageResult.tableId = this.util.currentTableId;
            chatMessageResult.messages = [chatMesage];
            this.handleChat(chatMessageResult);
        };
        PokerTable.prototype.getCards = function (hand) {
            var cardsArr = [];
            for (var _i = 0, hand_1 = hand; _i < hand_1.length; _i++) {
                var card = hand_1[_i];
                var suit = card.substring(card.length - 1);
                var value = card.substring(0, card.length - 1);
                cardsArr.push({ suit: CommonHelpers_1.getCardSuit(suit), value: value });
            }
            return cardsArr;
        };
        PokerTable.prototype.getPotWinnerSummary = function (potResult) {
            var summary = '';
            if (potResult.seatWinners.length === 1) {
                summary = this.getPlayerScreenName(potResult.seatWinners[0]) + (" won a pot of " + potResult.amountFormatted + "!");
            }
            else if (potResult.seatWinners.length > 1) {
                summary = potResult.amountFormatted + " Split Pot : Seats ";
                for (var i = 0; i < potResult.seatWinners.length; i++) {
                    summary += this.getPlayerScreenName(potResult.seatWinners[i]);
                    if (i !== potResult.seatWinners.length - 1)
                        summary += " & ";
                }
            }
            else {
                console.error('invalid pot result!', JSON.stringify(potResult));
            }
            if (potResult.winningHand) {
                summary += " - " + potResult.winningHand;
            }
            return summary;
        };
        PokerTable.prototype.getPlayerScreenName = function (seat) {
            return this.seats.find(function (h) { return h.seatIndex === seat; }).name;
        };
        PokerTable.prototype.openInfo = function () {
            this.dialogService.open({ viewModel: tournament_info_poup_1.TournamentInfoPopup, model: { name: '', id: this.util.currentTableConfig.tournamentId }, lock: false });
        };
        PokerTable.prototype.handleGame = function (game) {
            if (!this.isCurrentTableId(game.tableId)) {
                return;
            }
            Object.assign(this.game, game);
            this.potAmount = game.pot && game.pot.length > 0 ? game.pot[0] : null;
            if (game.potResults) {
                this.appendWinningHandToChat(game.potResults);
            }
            this.setStatusLabel();
            if (game.chipsToPot) {
                this.chipsToPot();
            }
            else {
                if (game.board && game.board.length)
                    this.setPotChips();
                else {
                    this.potChips = [];
                }
            }
            this.handleAction(game);
        };
        PokerTable.prototype.handleAction = function (game) {
            if (!game.action)
                return;
            var action = game.action;
            if (action === 'chipsToPlayer') {
                if (this.game && this.game.potResults) {
                    for (var _i = 0, _a = this.game.potResults; _i < _a.length; _i++) {
                        var potResult = _a[_i];
                        for (var _b = 0, _c = potResult.seatWinners; _b < _c.length; _b++) {
                            var winner = _c[_b];
                            this.seats[winner].chipsToPlayer();
                        }
                    }
                }
                this.returnCards();
                this.game.potResults = [];
                this.game.pot = [];
                this.game.board = [];
                for (var _d = 0, _e = this.seats; _d < _e.length; _d++) {
                    var seat = _e[_d];
                    seat.playercards = null;
                }
            }
            else if (action === 'fold') {
                this.util.playSound(this.apiService.audioFiles.fold);
            }
            else if (action === 'bet') {
                this.util.playSound(this.apiService.audioFiles.bet);
            }
            else if (action === 'check') {
                this.util.playSound(this.apiService.audioFiles.check);
            }
        };
        PokerTable.prototype.returnCards = function () {
            for (var _i = 0, _a = this.seats; _i < _a.length; _i++) {
                var seat = _a[_i];
                if (seat.playing && !seat.hasFolded)
                    seat.returnCards();
            }
        };
        PokerTable.prototype.setPotChips = function () {
            this.potChips = this.util.getChips(0, this.game.pot[0], this.potChipsFunc, this);
        };
        PokerTable.prototype.chipsToPot = function () {
            var _this = this;
            var args = { 'left': 390, 'top': 280 };
            var speed = 700;
            $.when($('.chip').not('.pot-chip').animate(args, speed)).then(function () {
                _this.setPotChips();
            });
        };
        PokerTable.prototype.tableConfigsHandler = function (data) {
            var _this = this;
            var configs = data.rows || [];
            if (!this.util.tableConfigs.length) {
                this.util.tableConfigs = configs;
            }
            if (this.util.currentTableConfig != null) {
                var updatedConfig = configs.find(function (t) { return t._id === _this.util.currentTableConfig._id; });
                if (updatedConfig != null) {
                    Object.assign(this.util.currentTableConfig, updatedConfig);
                }
            }
            this.ea.publish(new messages_1.TableConfigUpdated(configs));
        };
        PokerTable.prototype.setShowAutoFold = function () {
            if (this.seat) {
                var autoOptionResult = CommonHelpers_1.CommonHelpers.allowAutoFold(this.seat.guid, this.seats);
                this.showAutoFold = autoOptionResult.allowAutoFold;
                this.showAutoCheck = autoOptionResult.allowAutoCheck;
                this.autoFoldButtonText = autoOptionResult.autoFoldButtonText;
            }
            else {
                this.showAutoFold = false;
                this.showAutoCheck = false;
            }
        };
        PokerTable.prototype.potChipsFunc = function (potnum, stacknum, chipnum, quantity) {
            var potChipTop = 276;
            var pot1 = [[360, potChipTop], [342, potChipTop], [378, potChipTop], [324, potChipTop], [396, potChipTop]];
            var pot2 = [[277, 280], [259, 280], [295, 280], [241, 280], [313, 280]];
            var pot3 = [[508, 280], [490, 280], [526, 280], [472, 280], [544, 280]];
            var pots = Array(pot1, pot2, pot3);
            var pot = pots[potnum];
            var bottom_chip = pot[stacknum];
            var chips = [];
            for (var i = 0; i < quantity; i++) {
                var top = bottom_chip[1] - (2 * i);
                chips.push(this.util.getChip(chipnum, bottom_chip[0], top, 'pot-chip'));
            }
            return chips;
        };
        PokerTable.prototype.cashOut = function () {
            this.dialogService.open({ viewModel: cash_out_1.CashOut, lock: false });
        };
        PokerTable.prototype.join = function (seatnum) {
            this.util.requestNotificationPermission();
            if (this.apiService.authenticated || (this.util.currentTableConfig != null && this.util.currentTableConfig.currency == Currency_1.Currency.free)) {
                this.openFundingWindow(this.getFundingWindowModel(seatnum));
            }
            else {
                this.openLoginWindow();
            }
        };
        PokerTable.prototype.openLoginWindow = function (event) {
            this.dialogService.closeAll();
            this.dialogService.open({ viewModel: login_popup_1.LoginPopup, model: event });
        };
        PokerTable.prototype.getFundingWindowModel = function (seatnum) {
            var model = new funding_window_1.FundingWindowModel();
            model.tableConfig = this.util.currentTableConfig;
            model.seatnum = seatnum;
            model.playerStack = this.playerStack;
            return model;
        };
        PokerTable.prototype.openFundingWindow = function (model) {
            var _this = this;
            this.dialogService.open({ viewModel: funding_window_1.FundingWindow, model: model }).whenClosed(function (response) {
                if (!response.wasCancelled) {
                    _this.sendJoinTable(model.seatnum, response.output);
                }
            });
        };
        PokerTable.prototype.sendJoinTable = function (seatnum, amount) {
            var joinTableRequest = new ClientMessage_1.JoinTableRequest();
            joinTableRequest.seat = seatnum;
            joinTableRequest.tableId = this.util.currentTableId;
            joinTableRequest.amount = amount;
            this.apiService.send(joinTableRequest);
        };
        PokerTable.prototype.leaveTable = function () {
            var _this = this;
            var seat = this.seats.find(function (s) { return s.seatIndex === _this.playerSeat; });
            if (seat && seat.playing) {
                this.showWarning("You are still playing at table '" + this.util.currentTableConfig.name + "'!");
                return;
            }
            this.apiService.send(new ClientMessage_1.LeaveTableRequest(this.util.currentTableId));
        };
        PokerTable.prototype.handleAccountFunded = function (data) {
            if (data.balance) {
                this.updateBalance(data.currency, data.balance);
                if (data.currency != Currency_1.Currency.free) {
                    this.notifyFunded(data.paymentReceived, data.currency);
                }
            }
            this.ea.publish(Object.assign(new DataContainer_1.AccountFunded(), data));
        };
        PokerTable.prototype.notifyFunded = function (amount, currency) {
            this.util.notify("Your account has been credited with " + this.util.fromSmallest(amount, currency) + " " + currency.toUpperCase());
            this.util.playSound(this.apiService.audioFiles.win);
        };
        PokerTable.prototype.handleAccountWithdrawlResult = function (data) {
            if (data.success) {
                this.updateBalance(data.currency, parseFloat(data.balance));
            }
            this.ea.publish(Object.assign(new DataContainer_1.AccountWithdrawlResult(), data));
        };
        PokerTable.prototype.updateBalance = function (currency, balance) {
            var account = this.userData.accounts.find(function (acc) { return acc.currency.toLowerCase() === currency.toLowerCase(); });
            if (account != null)
                account.balance = balance;
            else
                this.userData.accounts.push(new DataContainer_1.Account(currency, balance));
            this.setPlayerStack();
        };
        PokerTable.prototype.handleSubscribeTableResult = function (result) {
            var _this = this;
            localStorage.setItem("subscribeTableResult", JSON.stringify(result));
            this.shutdownRequested = result.shutdownRequested;
            this.util.setCurrentTableId(result.tableId);
            this.util.currentTableConfig = result.tableConfig;
            this.smallBlind = result.tableConfig.smallBlind;
            this.bigBlind = result.tableConfig.bigBlind;
            this.isTournament = result.tableConfig.currency == Currency_1.Currency.tournament;
            var tableConfig = this.util.currentTableConfig;
            this.currency = tableConfig.currency;
            this.isCurrencyCrypto = this.currency && this.currency !== Currency_1.Currency.free && this.currency !== Currency_1.Currency.tournament;
            this.isLoadingTable = false;
            this.tableName = tableConfig.name;
            this.updateCanSit();
            this.setStatusLabel();
            this.setPlayerStack();
            window.clearInterval(this.blindsTimer);
            this.nextBlinds = null;
            if (this.isTournament && result.nextBlind) {
                this.updateFromNextBlind(result.nextBlind);
                this.blindsTimer = window.setInterval(function () {
                    var secRemaining = Math.round((_this.nextBlindIncrease.getTime() - new Date().getTime()) / 1000);
                    _this.updateNextBlinds(secRemaining);
                }, 200);
            }
        };
        PokerTable.prototype.updateFromNextBlind = function (nextBlind) {
            this.nextBlindIncrease = new Date(new Date().getTime() + nextBlind.remainingSec * 1000);
            this.updateNextBlinds(nextBlind.remainingSec, nextBlind.smallBlind, nextBlind.bigBlind);
        };
        PokerTable.prototype.updateNextBlinds = function (secRemaining, smallBlind, bigBlind) {
            var timeUntil = secRemaining;
            var timeUntilUnit = 'sec';
            if (secRemaining > 120) {
                timeUntil = Math.round(secRemaining / 60);
                timeUntilUnit = 'min';
            }
            if (smallBlind != null) {
                this.nextBlinds = { smallBlind: smallBlind, bigBlind: bigBlind, timeUntil: timeUntil, timeUntilUnit: timeUntilUnit, };
            }
            else {
                this.nextBlinds.timeUntil = timeUntil;
                this.nextBlinds.timeUntilUnit = timeUntilUnit;
            }
        };
        PokerTable.prototype.setPlayerStack = function () {
            if (this.playerSitting) {
                this.playerStack = this.seat.stack;
            }
            else {
                var tableConfig = this.util.currentTableConfig;
                var account = void 0;
                if (tableConfig != null) {
                    account = this.userData.accounts.find(function (acc) { return acc.currency.toLowerCase() === tableConfig.currency; });
                }
                this.playerStack = account == null ? 0 : account.balance;
            }
        };
        PokerTable.prototype.isCurrentTableId = function (tableId) {
            if (tableId != this.util.currentTableId) {
                console.warn("received tableSeatEvents for tableId " + tableId + " however the current tableId is " + this.util.currentTableId);
                return false;
            }
            return true;
        };
        PokerTable.prototype.handleSeats = function (tableSeatEvents) {
            if (!this.isCurrentTableId(tableSeatEvents.tableId)) {
                return;
            }
            var seats = tableSeatEvents.seats;
            this.updateSelf(seats);
            var _loop_1 = function (seat) {
                existingSeat = this_1.seats.find(function (s) { return s.seatIndex === seat.seat; });
                var nowEmpty = seat.empty && !existingSeat.empty;
                existingSeat.checkChanges(seat);
                Object.assign(existingSeat, seat);
                existingSeat.setChips();
                existingSeat.setHoleCards();
                if (nowEmpty) {
                    existingSeat.init();
                }
            };
            var this_1 = this, existingSeat;
            for (var _i = 0, seats_1 = seats; _i < seats_1.length; _i++) {
                var seat = seats_1[_i];
                _loop_1(seat);
            }
            this.updateCanSit();
            this.setStatusLabel();
            this.setBettingControls();
            this.setShowAutoFold();
            if (this.isTournament && !this.seats.filter(function (s) { return !s.empty; }).length) {
                this.clearBlinds();
            }
        };
        PokerTable.prototype.updateCanSit = function () {
            for (var _i = 0, _a = this.seats; _i < _a.length; _i++) {
                var seat = _a[_i];
                seat.canSit = !this.isTournament && !this.playerSitting && seat.empty;
            }
        };
        PokerTable.prototype.setStatusLabel = function () {
            if (this.shutdownRequested)
                this.statusLabel = 'Table is closed. Server is being restarted';
            else if (this.playerSitting && this.seat && this.seat.isSittingOut)
                this.statusLabel = 'You are currently sitting out.';
            else
                this.statusLabel = this.util.getStatusLabel(this.game, this.playerSitting, this.playerSeat, this.seats, this.gameStarting, this.isTournament);
        };
        PokerTable.prototype.closeLastYourTurnToActNotification = function () {
            if (this.lastYourTurnToActNotification != null) {
                this.lastYourTurnToActNotification.close();
                this.lastYourTurnToActNotification = null;
            }
        };
        PokerTable.prototype.updateSelf = function (seats) {
            var _this = this;
            for (var _i = 0, seats_2 = seats; _i < seats_2.length; _i++) {
                var seat = seats_2[_i];
                if (seat.guid || this.playerSeat === seat.seat) {
                    this.playerSitting = !seat.empty;
                    if (seat.empty) {
                        this.tableOptions.sitOutNextHand = false;
                        this.playerSeat = null;
                        this.seat = null;
                    }
                    else {
                        var priorMyTurn = this.seat != null && this.seat.myturn;
                        if (this.seat == null)
                            this.seat = seat;
                        else
                            Object.assign(this.seat, seat);
                        this.playerSeat = seat.seat;
                        if (!priorMyTurn && seat.myturn) {
                            this.util.playSound(this.apiService.audioFiles.yourturn);
                            if (!document.hasFocus()) {
                                this.closeLastYourTurnToActNotification();
                                this.util.notify('Your turn to act')
                                    .then(function (notification) {
                                    _this.lastYourTurnToActNotification = notification;
                                    if (_this.lastYourTurnToActNotification) {
                                        _this.lastYourTurnToActNotification.onclick = function (event) {
                                            window.focus();
                                            event.target.close();
                                        };
                                    }
                                });
                            }
                        }
                        else if (priorMyTurn && !seat.myturn) {
                            this.closeLastYourTurnToActNotification();
                        }
                    }
                    this.setPlayerStack();
                    break;
                }
            }
        };
        PokerTable.prototype.sitOutNextHandClicked = function () {
            this.sendSitOutNextHandClicked(this.tableOptions.sitOutNextHand);
        };
        PokerTable.prototype.imbackClicked = function () {
            this.sendingSittingBackIn = true;
            this.sendSitOutNextHandClicked(false);
        };
        PokerTable.prototype.sendSitOutNextHandClicked = function (value) {
            this.apiService.send(new ClientMessage_1.SetTableOptionRequest(this.util.currentTableId, value));
            this.apiService.loadSounds();
        };
        PokerTable.prototype.autoFoldClicked = function () {
            var autoCheck = null;
            if (this.tableOptions.autoCheck) {
                this.tableOptions.autoCheck = false;
                autoCheck = false;
            }
            this.sendSetTableOptionRequest(this.tableOptions.autoFold, autoCheck);
        };
        PokerTable.prototype.autoCheckClicked = function () {
            var autoFold = null;
            if (this.tableOptions.autoFold) {
                this.tableOptions.autoFold = false;
                autoFold = false;
            }
            this.sendSetTableOptionRequest(autoFold, this.tableOptions.autoCheck);
        };
        PokerTable.prototype.sendSetTableOptionRequest = function (autoFold, autoCheck) {
            var setTableOptionRequest = new ClientMessage_1.SetTableOptionRequest(this.util.currentTableId);
            if (autoFold != null)
                setTableOptionRequest.autoFold = autoFold;
            if (autoCheck != null)
                setTableOptionRequest.autoCheck = autoCheck;
            this.apiService.send(setTableOptionRequest);
        };
        PokerTable.prototype.chatKeyPress = function (event) {
            if (event.keyCode === 13) {
                this.sendChat();
            }
        };
        PokerTable.prototype.sendChat = function () {
            if (this.chatInput) {
                this.apiService.send(new ClientMessage_1.ChatRequest(this.util.currentTableId, this.chatInput));
                this.chatInput = '';
                this.apiService.loadSounds();
            }
        };
        PokerTable = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService, aurelia_dialog_1.DialogService, aurelia_event_aggregator_1.EventAggregator, util_1.Util, constants_1.Constants, aurelia_dialog_1.DialogController, aurelia_router_1.Router])
        ], PokerTable);
        return PokerTable;
    }());
    exports.PokerTable = PokerTable;
});



define('text!poker-table.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./next-tournament\"></require>\n<!-- <div id=\"leaderboard-lhs\">\n  \n</div> -->\n\n\n  <div id=\"poker-room\">\n    <div show.bind=\"tableName\" class=\"current-table-name\">\n      <span>${isTournament ? 'Tournament' : 'Table'}</span>: <span>${tableName} </span>\n      <span show.bind=\"isTournament\"><a href=\"#\" class=\"nounderline\" click.trigger=\"openInfo(tournament)\">\n          <span class=\"fa-stack\">\n              <i class=\"fa fa-circle fa-stack-2x\" style=\"color:black\"></i>\n              <i class=\"fa fa-info fa-stack-1x\" style=\"color:white\"></i> \n             </span>  \n      </a></span>\n      <div show.bind=\"isTournament\">\n        <div>\n        Blinds: ${util.currentTableConfig.smallBlind} / ${util.currentTableConfig.bigBlind}\n      </div>\n      <div show.bind=\"nextBlinds\" class=\"nextBlinds\">\n        <span>Increase: \n          <span show.bind=\"nextBlinds.timeUntil > 0\">${nextBlinds.smallBlind}/ ${nextBlinds.bigBlind} in ${nextBlinds.timeUntil} ${nextBlinds.timeUntilUnit}  </span>\n          <span show.bind=\"nextBlinds.timeUntil <= 0\">Next Hand</span>\n      </span>\n\n      </div>\n    </div>\n    </div>\n    <div class=\"pingTime\"><i class=\"fa fa-circle ${isConnected ? 'connected-icon' : 'disconnected-icon'}\"> </i><span show.bind=\"pingTime\"> ${pingTime} ms</span><span show.bind=\"!pingTime\"> Disconnected</span></div>    \n    <div id=\"loadingTable\" show.bind=\"isLoadingTable\">Loading table<i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i></div>\n\n    <div id=\"newGameStartingIn\" show.bind=\"gameStarting.isStarting\">New hand starting... \n      <span>${startingIn}</span>\n    <div show.bind=\"gameStarting.blindsChanging\">Blinds are now ${gameStarting.blindsChanging.smallBlind} and ${gameStarting.blindsChanging.bigBlind}</div>\n    </div>\n    <div class=\"cashOut\" click.delegate=\"cashOut()\">Cashier</div>\n    <require from=\"./lib/number-format\"></require>\n    <require from=\"./lib/crypto-format\"></require>\n\n    <template repeat.for=\"seat of seats\">\n      <compose view=\"seat.html\" view-model.bind=\"seat\" containerless />\n    </template>\n  \n    \n    <compose view-model=\"betting-controls\" view.bind=\"betting-controls.html\" view-model.ref=\"bettingControls\" containerless></compose>\n    \n    <div id=\"leaveTable\" class=\"btn btn-primary btn-xs\" click.delegate=\"leaveTable()\" show.bind=\"playerSitting && !isTournament\">Leave Table</div>\n    \n    <div id=\"pot-amount\" show.bind=\"potAmount\">Pot: <span>${potAmount | numberFormat}</span></div>\n    <div id=\"table-pot-amount\" show.bind=\"potAmount && game.board.length>0\"><span>${potAmount | numberFormat}</span></div>\n    <div id=\"infobox\">\n      <div id=\"gameinfo\">\n        <span>${playerSitting ? 'Stack:' : 'Account Balance:'}  ${playerStack | numberFormat}</span>\n        <span class=\"crypto-balance\" if.bind=\"isCurrencyCrypto\">${playerStack | cryptoFormat}</span>\n        <span class=\"currency-icon currency-${currency}\" if.bind=\"isCurrencyCrypto\"></span>\n\n        <!--<span id=\"tocall\" show.bind=\"game.tocall >= 0\">To call: ${game.tocall | numberFormat}</span>-->\n      </div>\n      <div id=\"chatbox\" ref=\"chatboxElem\" scrolltop.bind=\"chatboxElemScrollHeight\">\n        <p repeat.for=\"chat of chatMessages\" class=\"chatRow\">\n          <span class=\"${chat.screenName==='Dealer' ? 'chatDealer': 'chatScreenName'}\">${chat.screenName}:</span>\n          <span show.bind=\"chat.message\" class=\"chatMessage\">${chat.message}</span>\n          <span show.bind=\"chat.potResultChatSummaries.length\">\n            <span repeat.for=\"summary of chat.potResultChatSummaries\">\n              <span>${summary.text}</span>\n\n              <span show.bind=\"summary.cards.length\">            \n                  <br/><span repeat.for=\"card of summary.cards\" style=\"background-color: white;border-radius: 2px;padding:0 2px; margin: 0 2px;\" class=\"${card.suit==='♠'||card.suit==='♣' ? 'blackCard': 'redCard'}\">${card.value}${card.suit}</span>                  \n                </span>\n\n            </span>\n\n          </span>\n          \n        </p>        \n      </div>\n      <i class=\"fa ${playChatSound ? 'fa-volume-up' : 'fa-volume-off'}\" id=\"poker-room-chat-volume\" aria-hidden=\"true\" click.delegate=\"playChatSound=!playChatSound\"></i>\n      <div id=\"chat-input\">\n        <input type=\"text\" keyup.trigger=\"chatKeyPress($event)\" placeholder=\"enter chat message\" value.bind=\"chatInput\">\n        <div id=\"submitchat\" click.trigger=\"sendChat()\">Send</div>   \n        \n      </div>\n    </div>\n    <div id=\"side-pots\" class=\"hide\">\n      <strong>Side Pots:</strong>\n      <ol></ol>\n    </div>\n    \n    <div class=\"dealerbutton\" id=\"seat0button\" show.bind=\"game.dealer===0\">D</div>\n    <div class=\"dealerbutton\" id=\"seat1button\" show.bind=\"game.dealer===1\">D</div>\n    <div class=\"dealerbutton\" id=\"seat2button\" show.bind=\"game.dealer===2\">D</div>\n    <div class=\"dealerbutton\" id=\"seat3button\" show.bind=\"game.dealer===3\">D</div>\n    <div class=\"dealerbutton\" id=\"seat4button\" show.bind=\"game.dealer===4\">D</div>\n    <div class=\"dealerbutton\" id=\"seat5button\" show.bind=\"game.dealer===5\">D</div>\n    <div class=\"dealerbutton\" id=\"seat6button\" show.bind=\"game.dealer===6\">D</div>\n    <div class=\"dealerbutton\" id=\"seat7button\" show.bind=\"game.dealer===7\">D</div>\n    <div class=\"dealerbutton\" id=\"seat8button\" show.bind=\"game.dealer===8\">D</div>\n\n    <div class=\"boardcard\" id=\"card-0\"><div class=\"sprite sprite-${game.board[0]}-150\" if.bind=\"game.board.length>0\"></div></div>\n    <div class=\"boardcard\" id=\"card-1\"><div class=\"sprite sprite-${game.board[1]}-150\" if.bind=\"game.board.length>0\"></div></div>\n    <div class=\"boardcard\" id=\"card-2\"><div class=\"sprite sprite-${game.board[2]}-150\" if.bind=\"game.board.length>0\"></div></div>\n    <div class=\"boardcard\" id=\"card-3\"><div class=\"sprite sprite-${game.board[3]}-150\" if.bind=\"game.board.length>3\"></div></div>\n    <div class=\"boardcard\" id=\"card-4\"><div class=\"sprite sprite-${game.board[4]}-150\" if.bind=\"game.board.length>4\"></div></div>\n\n    \n    <div id=\"join-label\" show.bind=\"!isLoadingTable && statusLabel\" >\n      <div innerhtml.bind=\"statusLabel\"></div>\n      <button class=\"btn btn-primary margin-top-10\" click.delegate=\"imbackClicked(false)\" disabled.bind=\"sendingSittingBackIn\" show.bind=\"playerSitting && seat.isSittingOut\">I'm back <i show.bind=\"sendingSittingBackIn\" class=\"fa fa-spinner fa-spin\"></i></button>\n    </div>\n    \n    <div id=\"auto-controls\">\n      <div class=\"checkbox\" id=\"fold-any-bet\" show.bind=\"showAutoFold\">\n        <label><input type=\"checkbox\" value=\"\" checked.bind=\"tableOptions.autoFold\" change.delegate=\"autoFoldClicked()\">${autoFoldButtonText}</label>\n      </div>\n      <div class=\"checkbox\" id=\"auto-check-conatiner\" show.bind=\"showAutoCheck\">\n        <label><input type=\"checkbox\" value=\"\" checked.bind=\"tableOptions.autoCheck\" change.delegate=\"autoCheckClicked()\">Check</label>\n      </div>\n    </div>\n    \n    <div class=\"checkbox\" id=\"sitOutNextHandContainer\" show.bind=\"playerSitting\">\n      \n      <label><input type=\"checkbox\" value=\"1\" name=\"\" checked.bind=\"tableOptions.sitOutNextHand\" change.delegate=\"sitOutNextHandClicked()\">Sit out next hand</label>\n    </div>\n  <div repeat.for=\"chip of potChips\" class=\"${chip.classes}\" css=\"top: ${chip.top}px; left: ${chip.left}px;\"></div>\n    <compose view=\"./dealer-tray.html\"></compose>\n  </div> <!-- /poker-room -->\n  \n  <div class=\"poker-tables-container\">\n      <next-tournament></next-tournament>\n    <compose view-model=\"global-chat\" view.bind=\"global-chat.html\" containerless></compose>      \n    <div id=\"leaderboard-rhs\">\n        <compose view-model=\"leaderboard\" view.bind=\"leaderboard.html\" containerless></compose>    \n      </div>\n      \n  </div>\n  \n  <compose view-model=\"poker-rooms\" view.bind=\"poker-rooms.html\" containerless></compose>        \n\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('poker-rooms',["require", "exports", "./shared/ClientMessage", "aurelia-framework", "aurelia-event-aggregator", "./messages", "./lib/util", "moment", "./lib/api-service", "./shared/DataContainer", "aurelia-dialog", "./shared/TournmanetStatus", "./tournament-info-poup", "./shared/login-request"], function (require, exports, ClientMessage_1, aurelia_framework_1, aurelia_event_aggregator_1, messages_1, util_1, moment, api_service_1, DataContainer_1, aurelia_dialog_1, TournmanetStatus_1, tournament_info_poup_1, login_request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PokerRooms = (function () {
        function PokerRooms(ea, util, apiService, dialogService) {
            var _this = this;
            this.ea = ea;
            this.util = util;
            this.apiService = apiService;
            this.dialogService = dialogService;
            this.tableConfigs = [];
            this.tournaments = [];
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(messages_1.TableConfigUpdated, function (msg) { _this.handleTableConfigUpdated(msg); }));
            this.subscriptions.push(ea.subscribe(DataContainer_1.TournamentSubscriptionResult, function (msg) { _this.handleTournamentSubscriptionResult(msg); }));
            this.subscriptions.push(ea.subscribe(messages_1.ConnectionClosedEvent, function (msg) { _this.onConnectionClosed(); }));
            this.subscriptions.push(ea.subscribe(login_request_1.LoginResult, function (r) { return _this.hasSubscribed = false; }));
            this.cashGamesVisible = true;
        }
        PokerRooms.prototype.handleTournamentSubscriptionResult = function (result) {
            this.tournamentCount = result.tournamentCount;
            var _loop_1 = function (row) {
                var existing = this_1.tournaments.find(function (t) { return t.id == row.id; });
                if (existing) {
                    Object.assign(existing, row);
                    if (row.joined)
                        existing.registering = false;
                }
                else {
                    this_1.tournaments.push(row);
                    existing = row;
                    this_1.setStatusText(row);
                }
                this_1.setStatusText(existing);
                var canRegisterResult = this_1.util.canRegister(existing);
                existing.canRegister = canRegisterResult.success;
                existing.isLate = canRegisterResult.isLate;
                if (this_1.hasSubscribed && existing.status == TournmanetStatus_1.TournmanetStatus.Started && existing.joined && (!this_1.util.currentTableConfig || !this_1.util.currentTableConfig.tournamentId)) {
                    var subscribeToTableRequest = new ClientMessage_1.SubscribeToTableRequest();
                    subscribeToTableRequest.tournamentId = row.id;
                    this_1.apiService.send(subscribeToTableRequest);
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = result.tournaments; _i < _a.length; _i++) {
                var row = _a[_i];
                _loop_1(row);
            }
            this.receivedTournaments = true;
            this.subscribeToTableOrTournament();
        };
        PokerRooms.prototype.setStatusText = function (row) {
            if (!row.status) {
                var momentDate = moment(row.startTime);
                var startTimeLocal = moment(row.startTime).format('D MMM YYYY h:mm A');
                row.statusText = startTimeLocal + " (" + momentDate.fromNow() + ")";
            }
            else {
                row.statusText = TournmanetStatus_1.TournmanetStatus[row.status];
            }
        };
        PokerRooms.prototype.handleTableConfigUpdated = function (msg) {
            var _loop_2 = function (config) {
                var existingConfig = this_2.tableConfigs.find(function (t) { return t._id === config._id; });
                if (existingConfig != null) {
                    Object.assign(existingConfig, config);
                }
                else {
                    this_2.tableConfigs.push(config);
                }
            };
            var this_2 = this;
            for (var _i = 0, _a = msg.config; _i < _a.length; _i++) {
                var config = _a[_i];
                _loop_2(config);
            }
            this.subscribeToTableOrTournament();
        };
        PokerRooms.prototype.onConnectionClosed = function () {
            this.tableConfigs = [];
            this.tournaments = [];
            this.hasSubscribed = false;
            this.receivedTournaments = false;
        };
        PokerRooms.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        PokerRooms.prototype.openTable = function (tableId) {
            this.ea.publish(new messages_1.OpenTableAction(tableId));
        };
        PokerRooms.prototype.registerForTournament = function (tournament) {
            this.ea.publish(new messages_1.TournamentRegisterClickEvent(tournament));
        };
        PokerRooms.prototype.subscribeToTableOrTournament = function () {
            if (this.hasSubscribed || !this.tableConfigs.length || !this.receivedTournaments)
                return;
            this.hasSubscribed = true;
            var request = this.getSubscribeRequest();
            if (request.tableId || request.tournamentId) {
                this.apiService.send(request);
            }
        };
        PokerRooms.prototype.getSubscribeRequest = function () {
            var request = new ClientMessage_1.SubscribeToTableRequest();
            var lastSubscribeResult = JSON.parse(localStorage.getItem("subscribeTableResult"));
            var tournament = this.tournaments.find(function (t) { return t.status == TournmanetStatus_1.TournmanetStatus.Started && t.joined == true; });
            if (tournament) {
                request.tournamentId = tournament.id;
                if (lastSubscribeResult && lastSubscribeResult.tournamentId == tournament.id) {
                    request.tableId = lastSubscribeResult.tableId;
                }
                return request;
            }
            if (lastSubscribeResult) {
                if (lastSubscribeResult.tournamentId) {
                    if (this.tournaments.find(function (t) { return t.id == lastSubscribeResult.tournamentId && t.status == TournmanetStatus_1.TournmanetStatus.Started; })) {
                        console.log('rejoining tournament');
                        request.tournamentId = lastSubscribeResult.tournamentId;
                        request.tableId = lastSubscribeResult.tableId;
                        return request;
                    }
                }
                if (lastSubscribeResult.tableId && !tournament) {
                    if (this.tableConfigs.find(function (t) { return t._id == lastSubscribeResult.tableId; })) {
                        request.tableId = lastSubscribeResult.tableId;
                        return request;
                    }
                }
            }
            var maxPlayers = 0;
            var maxTournamentPlayers = 0;
            for (var _i = 0, _a = this.tableConfigs; _i < _a.length; _i++) {
                var tableConfig = _a[_i];
                if (tableConfig.tournamentId) {
                    if (tableConfig.numPlayers > maxTournamentPlayers) {
                        maxTournamentPlayers = tableConfig.numPlayers;
                        request.tableId = tableConfig._id;
                    }
                }
                else {
                    if (tableConfig.numPlayers > maxPlayers && maxTournamentPlayers < 1) {
                        maxPlayers = tableConfig.numPlayers;
                        request.tableId = tableConfig._id;
                    }
                }
            }
            if (!request.tableId && this.tableConfigs.length) {
                request.tableId = this.tableConfigs[0]._id;
            }
            return request;
        };
        PokerRooms.prototype.openInfo = function (tournament) {
            this.dialogService.open({ viewModel: tournament_info_poup_1.TournamentInfoPopup, model: { name: tournament.name, id: tournament.id }, lock: false });
        };
        PokerRooms = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, util_1.Util, api_service_1.ApiService, aurelia_dialog_1.DialogService])
        ], PokerRooms);
        return PokerRooms;
    }());
    exports.PokerRooms = PokerRooms;
});



define('text!poker-rooms.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./lib/number-format\"></require>\n  <require from=\"./lib/TournamentFilterValueConverter\"></require>\n  <div style=\"margin-top: 10px;\">\n    <!-- <button class=\"btn btn-xs btn-primary\" click.delegate=\"cashGamesVisible=true\">Cash Games</button>\n    <button class=\"btn btn-xs btn-primary\" click.delegate=\"cashGamesVisible=false\">Tournaments</button> -->\n    <h4>Casual Tables</h4>\n    <table class=\"poker-tables margin-top-5\">\n      <thead>\n        <tr>\n          <th>Table Name</th>\n          <th>Blinds</th>\n          <th>Currency</th>\n          <th>Players</th>\n        </tr>\n      </thead>\n      <tbody>\n        <tr repeat.for=\"table of tableConfigs | tournamentFilter:null\" class=\"${table._id===util.currentTableId ? 'poker-rooms-current-table' : ''}\"\n            model.bind=\"table.id\" data-id=\"${table._id}\" click.trigger=\"openTable(table._id)\">\n          <td><span class=\"label label-default poker-rooms-joined-label\" if.bind=\"table._id===util.currentTableId\"><i class=\"fa fa-check\" aria-hidden=\"true\"></i> Joined </span> ${table.name}</td>\n          <td>${table.smallBlindUsd | numberFormat:'usd'} / ${table.bigBlindUsd | numberFormat:'usd'}</td>\n          <td>\n            <span class=\"table-currency\">${table.currency}</span>\n            <i class=\"currency-icon currency-${table.currency}\"></i>\n            \n          </td>\n          <td>${table.numPlayers}/${table.maxPlayers}</td>\n        </tr>\n      </tbody>\n    </table>\n\n    <h4 style=\"margin-top:50px;\">Tournaments</h4>\n    <div>\n      <p style=\"text-align: center; margin-top: 10px;\">Click a tournament to Join</p>\n      <table class=\"poker-tables margin-top-5\" >\n        <thead>\n          <tr>\n            <th>Name</th>\n            <th>Currency</th>\n            <th>Start Time</th>\n            <th>Total Prize</th>\n            <th>Players</th>\n          </tr>\n        </thead>\n        <tbody>\n          <tr repeat.for=\"tournament of tournaments\" style=\"cursor:default;\">\n            <td>\n                <a class=\"label label-default tournament-action-button poker-rooms-joined-label\" show.bind=\"tournament.joined && !tournament.status\"><i class=\"fa fa-check\"></i> Registered </a>\n                <a class=\"label label-default tournament-action-button\" show.bind=\"tournament.canRegister\" \n                click.trigger=\"registerForTournament(tournament)\" disabled.bind=\"tournament.registering\">\n                  <i class=\"fa ${tournament.registering ? 'fa-spinner fa-spin': 'fa-plus'}\"></i> ${tournament.registering ? 'Registering': 'Register Now'} \n                  <span> ${tournament.isLate ? '(Closing Soon!)': ''}</span>\n                </a>\n                <a class=\"label label-default tournament-action-button\" show.bind=\"tournament.joined && tournament.status==1\"  disabled><i class=\"fa fa-trophy\"></i> Playing </a>\n                <a href=\"#\" class=\"nounderline\" click.trigger=\"openInfo(tournament)\"><i class=\"fa fa-info-circle tournament-info\"></i>  </a>\n                \n                \n              <span>${tournament.name}</span>\n\n              <a class=\"pull-right nounderline\" show.bind=\"tournament.status==1\" click.trigger=\"tournament.showTables = !tournament.showTables\"><i class=\"fa ${tournament.showTables ? 'fa-angle-double-up':'fa-angle-double-down'}\"></i> Show Tables </a>\n\n              <div show.bind=\"tournament.showTables\">\n                \n                <table>\n                  <thead>\n                    <tr>\n                      <th>Table</th>\n                      <th>Blinds</th>\n                      <th>Players</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    <tr repeat.for=\"table of tableConfigs | tournamentFilter:tournament.id\" class=\"${table._id===util.currentTableId ? 'poker-rooms-current-table' : ''}\"\n                      model.bind=\"table.id\" data-id=\"${table._id}\" click.trigger=\"openTable(table._id)\">\n                      <td>\n                        <span><span class=\"label label-default poker-rooms-joined-label\" if.bind=\"table._id===util.currentTableId\"><i class=\"fa fa-check\"\n                          aria-hidden=\"true\"></i> Joined </span> ${table.name}</span>\n                      </td>\n                      <td>\n                        <span>${table.smallBlind | numberFormat:table} / ${table.bigBlind | numberFormat:table}</span>\n                        \n                      </td>\n                    <td>\n                      <span>${table.numPlayers}/${table.maxPlayers}</span>\n                    </td>\n                      \n                    \n                      \n                      </tr>\n                  </tbody>\n                </table>\n                \n              </div>\n\n              \n\n            </td>\n            <td><span class=\"table-currency\">${tournament.currency}</span>\n              <i class=\"currency-icon currency-${tournament.currency}\">\n            </td>\n            <td><span>${tournament.statusText}</span></td>\n            <td>\n              <span>${tournament.totalPrize}</span> \n              <span class=\"table-currency\">${tournament.currency}</span> \n              <i class=\"currency-icon currency-${tournament.currency}\"></i>\n              <!-- <span>(${tournament.totalPrizeUsd})</span> -->\n            </td>\n            <td>\n              ${tournament.playerCount}              \n            </td>\n          </tr>\n        </tbody>\n      </table>\n      <p style=\"font-size:0.8em; font-style:italic;margin-top:5px;\">Showing ${tournaments.length} of ${tournamentCount} Tournaments</p>\n    </div>\n  </div>\n\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('payment-history',["require", "exports", "aurelia-framework", "aurelia-event-aggregator", "./lib/util", "./shared/DataContainer", "./shared/CommonHelpers"], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, util_1, DataContainer_1, CommonHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PaymentHistory = (function () {
        function PaymentHistory(util, ea) {
            var _this = this;
            this.util = util;
            this.ea = ea;
            this.loading = true;
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.PaymentHistoryResult, function (r) { return _this.handlePaymentHistoryResult(r); }));
        }
        PaymentHistory.prototype.handlePaymentHistoryResult = function (result) {
            this.loading = false;
            if (!result.payments) {
                result.payments = [];
            }
            this.payments = result.payments;
            for (var _i = 0, _a = result.payments; _i < _a.length; _i++) {
                var payment = _a[_i];
                payment.txHashLink = CommonHelpers_1.CommonHelpers.getTxHashLink(payment.txHash, payment.currency);
            }
        };
        PaymentHistory.prototype.attached = function () {
        };
        PaymentHistory.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        PaymentHistory = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [util_1.Util, aurelia_event_aggregator_1.EventAggregator])
        ], PaymentHistory);
        return PaymentHistory;
    }());
    exports.PaymentHistory = PaymentHistory;
});



define('text!payment-history.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./lib/crypto-format\"></require>\n  <require from=\"./lib/capitalize-first\"></require>\n  <require from=\"./lib/local-date\"></require>\n  <require from=\"./lib/payment-type-abbrev\"></require>\n\n  <div class=\"form-group\" show.bind=\"loading\">\n    <span>Loading payments please wait...</span>\n    <i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i>\n  </div>\n  <div show.bind=\"payments && !payments.length\">You do not have any payment history</div>\n  <div show.bind=\"payments.length\">\n    <div repeat.for=\"payment of payments\">\n\n    </div>\n    <div style=\"max-height: 400px; overflow:auto\">\n        <table class=\"table table-striped table-bordered table-hover table-condensed\">\n            <thead>\n              <tr>\n                <th>Date</th>\n                <th>Type</th>          \n                <th>Amount</th>\n                <th>Status/Comment</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr repeat.for=\"payment of payments\">          \n                <td>${payment.timestamp | localDate }</td>\n                <td>\n                  <span css=\"color: ${payment.type === 'incoming' ? 'green' : 'red'};\">${payment.type | paymentTypeAbbrev}\n                      <i class=\"fa ${payment.type === 'incoming' ? 'fa-arrow-left' : 'fa-arrow-right'}\"></i>\n                  </span>\n                  \n                </td>          \n                <td>\n                  <span>${payment.amount | cryptoFormat:payment.currency}</span>\n                  <span class=\"uppercase\">${payment.currency}</span> <span class=\"currency-icon currency-${payment.currency}\"></span>\n                </td>\n                <td>\n                    \n                  <span>\n                    <a show.bind=\"payment.txHash\" href.bind=\"payment.txHashLink\" target=\"_blank\">${payment.status | capitalizeFirst}</a>\n                    <span show.bind=\"!payment.txHash\">${payment.status | capitalizeFirst}</span>\n                  </span>\n                <span show.bind=\"payment.status === 'pending' && payment.type === 'incoming'\" title=\"${payment.confirmations} of ${payment.requiredConfirmations} confirmations\">\n                <i class=\"fa fa-info-circle\" style=\"margin-left: 8px;\"></i>  \n                </span>\n\n                <span show.bind=\"payment.status === 'pending' && payment.type === 'outgoing'\" title=\"Withdrawl accepted awaiting processing\">\n                    <i class=\"fa fa-info-circle\" style=\"margin-left: 8px;\"></i>  \n                    </span>\n                <div show.bind=\"payment.comment\" style=\"font-size:0.8em; font-style:italic;\">${payment.comment}</div>\n                \n              </td>\n              </tr>\n            </tbody>\n          </table>\n    </div>\n  </div>\n  \n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('next-tournament',["require", "exports", "aurelia-framework", "aurelia-event-aggregator", "./lib/util", "./lib/api-service", "./shared/DataContainer", "./shared/TournmanetStatus", "moment", "aurelia-dialog", "./messages", "./tournament-info-poup"], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, util_1, api_service_1, DataContainer_1, TournmanetStatus_1, moment, aurelia_dialog_1, messages_1, tournament_info_poup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NextTournament = (function () {
        function NextTournament(ea, util, apiService, dialogService) {
            var _this = this;
            this.ea = ea;
            this.util = util;
            this.apiService = apiService;
            this.dialogService = dialogService;
            this.subscriptions = [];
            this.startingIn = '';
            this.tournaments = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.TournamentSubscriptionResult, function (msg) { _this.handleTournamentSubscriptionResult(msg); }));
            this.subscriptions.push(ea.subscribe(messages_1.ConnectionClosedEvent, function (msg) { _this.handleConnectionClosedEvent(); }));
        }
        NextTournament.prototype.handleConnectionClosedEvent = function () {
            this.tournament = null;
            this.clear();
        };
        NextTournament.prototype.clear = function () {
            this.started = false;
            this.starting = false;
            window.clearInterval(this.timer);
        };
        NextTournament.prototype.handleTournamentSubscriptionResult = function (result) {
            var _this = this;
            window.clearInterval(this.timer);
            var _loop_1 = function (tournament) {
                var existing = this_1.tournaments.find(function (t) { return t.id == tournament.id; });
                if (existing) {
                    Object.assign(existing, tournament);
                }
                else {
                    this_1.tournaments.push(tournament);
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = result.tournaments; _i < _a.length; _i++) {
                var tournament = _a[_i];
                _loop_1(tournament);
            }
            this.tournament = this.tournaments.find(function (t) { return !t.status; });
            if (!this.tournament) {
                for (var _b = 0, _c = this.tournaments; _b < _c.length; _b++) {
                    var tournament = _c[_b];
                    var canRegisterResult = this.util.canRegister(tournament);
                    if (canRegisterResult.success && canRegisterResult.isLate) {
                        this.tournament = tournament;
                        break;
                    }
                }
            }
            if (this.tournament) {
                var canRegisterResult = this.util.canRegister(this.tournament);
                this.tournament.canRegister = canRegisterResult.success;
                this.tournament.isLate = canRegisterResult.isLate;
                this.startTime = moment(this.tournament.startTime);
                if (!this.tournament.isLate) {
                    this.updateStartingIn();
                    this.timer = window.setInterval(function () {
                        _this.updateStartingIn();
                    }, 1000);
                }
                this.started = this.tournament.status == TournmanetStatus_1.TournmanetStatus.Started;
                if (this.tournament.status == TournmanetStatus_1.TournmanetStatus.Started && this.starting) {
                    this.starting = false;
                }
            }
            else {
                this.clear();
            }
        };
        NextTournament.prototype.updateStartingIn = function () {
            var now = moment(new Date());
            var diff = this.startTime.diff(now);
            if (diff <= 0) {
                window.clearInterval(this.timer);
                this.starting = true;
            }
            var diffDuration = moment.duration(diff);
            var startingIn = '';
            if (diffDuration.days() > 0) {
                startingIn = diffDuration.days() + " day" + (diffDuration.days() > 1 ? 's' : '') + ", ";
            }
            startingIn += diffDuration.hours().toString().padStart(2, '0') + ":" + diffDuration.minutes().toString().padStart(2, '0') + ":" + diffDuration.seconds().toString().padStart(2, '0');
            this.startingIn = startingIn;
        };
        NextTournament.prototype.registerForTournament = function () {
            this.ea.publish(new messages_1.TournamentRegisterClickEvent(this.tournament));
        };
        NextTournament.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
            clearInterval(this.timer);
        };
        NextTournament.prototype.openInfo = function () {
            this.dialogService.open({ viewModel: tournament_info_poup_1.TournamentInfoPopup, model: { name: this.tournament.name, id: this.tournament.id }, lock: false });
        };
        NextTournament.prototype.attached = function () {
        };
        NextTournament = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, util_1.Util, api_service_1.ApiService, aurelia_dialog_1.DialogService])
        ], NextTournament);
        return NextTournament;
    }());
    exports.NextTournament = NextTournament;
});



define('text!next-tournament.html', ['module'], function(module) { module.exports = "<template>\n  <div show.bind=\"tournament\" style=\"margin:15px 0; border: 1px solid gray; padding: 5px;text-align: center;\">\n      <p>          \n          <span>\n            <a href=\"#\" class=\"nounderline\" click.trigger=\"openInfo()\"><i class=\"fa fa-info-circle tournament-info\"></i>  </a> ${tournament.name} \n            <span> - <span>${tournament.totalPrize}</span> \n            <span class=\"table-currency\">${tournament.currency}</span> \n            <i class=\"currency-icon currency-${tournament.currency}\"></i></span>\n          </span> \n          <div>\n            <span show.bind=\"!starting && !started\"><span class=\"tournament-starting-in\">${startingIn}</span></span>\n            <span show.bind=\"starting\">Starting <i class=\"fa fa-spinner fa-spin\"></i></span> \n            <span show.bind=\"started\">Started! </span> \n          </div>\n          \n        </p>\n\n\n        <a class=\"label label-default tournament-action-button poker-rooms-joined-label\" show.bind=\"!starting && tournament.joined && !tournament.status\"><i class=\"fa fa-check\"></i> Registered </a>\n\n        <p style=\"margin: 20px 0;\" show.bind=\"tournament.canRegister\">\n            <a class=\"label label-default next-tournament-register-button\" click.trigger=\"registerForTournament()\"\n            disabled.bind=\"tournament.registering\">\n            <i class=\"fa ${tournament.registering ? 'fa-spinner fa-spin': 'fa-plus'}\"></i> \n            <span show.bind=\"tournament.registering\">Registering</span>\n            <span show.bind=\"!tournament.registering\">Register Now\n                <span show.bind=\"tournament.isLate\" style=\"font-size:0.25em;\"> Closing Soon!</span>\n            </span>\n            \n            \n          </a>\n        </p>\n        \n        \n        \n        \n\n  </div>\n\n</template>\n"; });
define('model/chip',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Chip = (function () {
        function Chip() {
        }
        return Chip;
    }());
    exports.Chip = Chip;
});



define('model/User',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var User = (function () {
        function User() {
        }
        return User;
    }());
    exports.User = User;
});



define('model/PotResultChatSummary',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PotResultChatSummary = (function () {
        function PotResultChatSummary() {
        }
        return PotResultChatSummary;
    }());
    exports.PotResultChatSummary = PotResultChatSummary;
});



define('messages',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TableConfigUpdated = (function () {
        function TableConfigUpdated(config) {
            this.config = config;
        }
        return TableConfigUpdated;
    }());
    exports.TableConfigUpdated = TableConfigUpdated;
    var SitDownAction = (function () {
        function SitDownAction(seatIndex) {
            this.seatIndex = seatIndex;
        }
        return SitDownAction;
    }());
    exports.SitDownAction = SitDownAction;
    var DataMessageEvent = (function () {
        function DataMessageEvent(data) {
            this.data = data;
        }
        return DataMessageEvent;
    }());
    exports.DataMessageEvent = DataMessageEvent;
    var OpenTableAction = (function () {
        function OpenTableAction(tableId) {
            this.tableId = tableId;
        }
        return OpenTableAction;
    }());
    exports.OpenTableAction = OpenTableAction;
    var ConnectionClosedEvent = (function () {
        function ConnectionClosedEvent() {
        }
        return ConnectionClosedEvent;
    }());
    exports.ConnectionClosedEvent = ConnectionClosedEvent;
    var OpenLoginPopupEvent = (function () {
        function OpenLoginPopupEvent(openRegisterTab) {
            this.openRegisterTab = openRegisterTab;
        }
        return OpenLoginPopupEvent;
    }());
    exports.OpenLoginPopupEvent = OpenLoginPopupEvent;
    var TournamentRegisterClickEvent = (function () {
        function TournamentRegisterClickEvent(tournament) {
            this.tournament = tournament;
        }
        return TournamentRegisterClickEvent;
    }());
    exports.TournamentRegisterClickEvent = TournamentRegisterClickEvent;
    var RegisterNowClicked = (function () {
        function RegisterNowClicked() {
        }
        return RegisterNowClicked;
    }());
    exports.RegisterNowClicked = RegisterNowClicked;
    var DepositNowEvent = (function () {
        function DepositNowEvent(model) {
            this.model = model;
        }
        return DepositNowEvent;
    }());
    exports.DepositNowEvent = DepositNowEvent;
    var SetBettingControlsEvent = (function () {
        function SetBettingControlsEvent(seat, game) {
            this.seat = seat;
            this.game = game;
        }
        return SetBettingControlsEvent;
    }());
    exports.SetBettingControlsEvent = SetBettingControlsEvent;
    var ResetPasswordClicked = (function () {
        function ResetPasswordClicked() {
        }
        return ResetPasswordClicked;
    }());
    exports.ResetPasswordClicked = ResetPasswordClicked;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('message-window',["require", "exports", "aurelia-framework", "aurelia-dialog"], function (require, exports, aurelia_framework_1, aurelia_dialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MessageWindow = (function () {
        function MessageWindow(controller) {
            this.controller = controller;
        }
        MessageWindow.prototype.activate = function (model) {
            this.message = model;
        };
        MessageWindow = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController])
        ], MessageWindow);
        return MessageWindow;
    }());
    exports.MessageWindow = MessageWindow;
});



define('text!message-window.html', ['module'], function(module) { module.exports = "<template>\n  <ux-dialog>    \n    <ux-dialog-body>\n      <h3>Warning! <i class=\"fa fa-exclamation-triangle\" aria-hidden=\"true\"></i></h3>\n      \n      <p class=\"alert alert-danger\">\n        ${message}\n      </p>\n      \n    </ux-dialog-body>\n    <ux-dialog-footer>\n      <button click.trigger=\"controller.ok()\">Ok</button>\n    </ux-dialog-footer>\n  </ux-dialog>\n</template>\n"; });
define('main',["require", "exports", "./environment", "./lib/api-service"], function (require, exports, environment_1, api_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function configure(aurelia) {
        aurelia.use
            .standardConfiguration()
            .feature('resources')
            .plugin('aurelia-dialog', function (config) {
            config.useDefaults();
            config.settings.lock = true;
            config.settings.centerHorizontalOnly = false;
            config.settings.startingZIndex = 5;
            config.settings.keyboard = true;
        });
        if (environment_1.default.debug) {
            aurelia.use.developmentLogging();
        }
        if (environment_1.default.testing) {
            aurelia.use.plugin('aurelia-testing');
        }
        aurelia.start().then(function () {
            var api = aurelia.container.get(api_service_1.ApiService);
            if (environment_1.default.debug) {
                aurelia.setRoot();
            }
            else {
                api.countryCheck()
                    .then(function (result) {
                    if (result.success === false)
                        window.location.href = "/restricted.html?c=" + result.country;
                    else
                        aurelia.setRoot();
                })
                    .catch(function (reason) {
                    console.error(reason);
                });
            }
        });
    }
    exports.configure = configure;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('login-popup',["require", "exports", "aurelia-framework", "aurelia-dialog", "jquery", "aurelia-event-aggregator", "./messages"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, $, aurelia_event_aggregator_1, messages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoginPopup = (function () {
        function LoginPopup(controller, ea) {
            var _this = this;
            this.controller = controller;
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(messages_1.RegisterNowClicked, function (r) { return _this.changeTab('register'); }));
            this.subscriptions.push(ea.subscribe(messages_1.ResetPasswordClicked, function (r) { return _this.changeTab('resetPassword'); }));
        }
        LoginPopup.prototype.activate = function (model) {
            if (model) {
                this.openRegisterTab = model.openRegisterTab;
                this.tournamentId = model.tournamentId;
            }
        };
        LoginPopup.prototype.attached = function () {
            if (this.openRegisterTab) {
                this.changeTab('register');
            }
        };
        LoginPopup.prototype.changeTab = function (tab) {
            $('.nav-tabs a[href="#' + tab + '"]').tab('show');
        };
        LoginPopup = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, aurelia_event_aggregator_1.EventAggregator])
        ], LoginPopup);
        return LoginPopup;
    }());
    exports.LoginPopup = LoginPopup;
});



define('text!login-popup.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./login-form\"></require>\n  <require from=\"./register-form\"></require>\n  <require from=\"./forgot-password-form\"></require>  \n  <ux-dialog>\n    <ux-dialog-body>\n\n      <ul class=\"nav nav-tabs\">\n        <li class=\"active\">\n          <a data-toggle=\"tab\" href=\"#login\">Login</a>\n        </li>\n        <li>\n          <a data-toggle=\"tab\" href=\"#register\">Register</a>\n        </li>\n\n        <li>\n          <a data-toggle=\"tab\" href=\"#resetPassword\">Forgot Password</a>\n        </li>\n      </ul>\n      <div class=\"tab-content\">\n        <div id=\"login\" class=\"tab-pane fade in active\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <login-form></login-form>\n\n            </div>\n          </div>\n        </div>\n        <div id=\"register\" class=\"tab-pane fade\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <register-form tournament-id.bind=\"tournamentId\"></register-form>\n            </div>\n          </div>\n        </div>\n\n        <div id=\"resetPassword\" class=\"tab-pane fade\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <forgot-password-form></forgot-password-form>\n            </div>\n          </div>\n        </div>\n\n      </div>\n\n\n\n\n\n    </ux-dialog-body>\n    <ux-dialog-footer>\n      <button click.trigger=\"controller.cancel()\">Close</button>\n    </ux-dialog-footer>\n  </ux-dialog>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('login-form',["require", "exports", "./shared/login-request", "aurelia-framework", "aurelia-event-aggregator", "./lib/api-service", "./shared/ClientMessage", "./messages"], function (require, exports, login_request_1, aurelia_framework_1, aurelia_event_aggregator_1, api_service_1, ClientMessage_1, messages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoginForm = (function () {
        function LoginForm(ea, apiService) {
            var _this = this;
            this.ea = ea;
            this.apiService = apiService;
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(login_request_1.LoginResult, function (r) { return _this.handleLoginResult(r); }));
        }
        LoginForm.prototype.handleLoginResult = function (result) {
            this.loggingIn = false;
            this.loginResult = result;
            this.apiService.send(new ClientMessage_1.TournamentSubscriptionRequest());
        };
        LoginForm.prototype.login = function () {
            this.loggingIn = true;
            var message = new ClientMessage_1.ClientMessage();
            message.loginRequest = new login_request_1.LoginRequest(this.loginEmail, this.loginPassword);
            this.apiService.sendMessage(message);
            this.apiService.loadSounds();
        };
        LoginForm.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        LoginForm.prototype.registerNowClicked = function () {
            this.ea.publish(new messages_1.RegisterNowClicked());
        };
        LoginForm.prototype.resetPasswordClicked = function () {
            this.ea.publish(new messages_1.ResetPasswordClicked());
        };
        LoginForm = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService])
        ], LoginForm);
        return LoginForm;
    }());
    exports.LoginForm = LoginForm;
});



define('text!login-form.html', ['module'], function(module) { module.exports = "<template>\n    <form>\n\n                  \n        <div class=\"form-group\">\n          <label>Email</label>\n          <input type=\"email\" class=\"form-control\" value.bind=\"loginEmail\" placeholder=\"Your email\" disabled.bind=\"loggingIn || loginResult.success\">\n        </div>\n    \n        <div class=\"form-group\">\n          <label>Password</label>\n          <input type=\"password\" class=\"form-control\" value.bind=\"loginPassword\" placeholder=\"Your password\" disabled.bind=\"loggingIn || loginResult.success\">\n        </div>                                \n    \n        <div class=\"alert alert-danger form-group\" show.bind=\"loginResult.errorMessage\">\n          ${loginResult.errorMessage}\n        </div>\n\n        <div class=\"alert alert-success\" show.bind=\"loginResult.success\">\n            <p>Logged in successfully! <i class=\"fa fa-check\"></i></p>                     \n        </div>\n    \n        <div class=\"form-group\">\n          <button click.trigger=\"login()\" disabled.bind=\"loggingIn || loginResult.success\" class=\"btn btn-primary\">Login <i class=\"fa fa-refresh fa-spin\" show.bind=\"loggingIn\"></i></button>\n        </div>\n      </form>\n      <div show.bind=\"!loginResult.success\">\n          <p>New User? <a href=\"#\" click.delegate=\"registerNowClicked()\">Register now!</a> </p>\n          <p>Forgot Password? <a href=\"#\" click.delegate=\"resetPasswordClicked()\">Reset Password</a></p>\n      </div>\n</template>\n"; });
define('logged-out',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LoggedOut = (function () {
        function LoggedOut() {
        }
        return LoggedOut;
    }());
    exports.LoggedOut = LoggedOut;
});



define('text!logged-out.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"container\">\n    <div class=\"row\" style=\"padding: 20px 0\">\n      \n      <h2 class=\"text-center\">You have been logged out </h2>\n\n      <a route-href=\"route: home\" class=\"btn btn-primary btn-xs\" style=\"float: right\">Back home</a>\n\n     \n  </div>\n\n</template>\n"; });
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('lib/websocket',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WebSocketClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
  //      Copyright (c) 2012 Mathieu Turcotte
  //      Licensed under the MIT license.
  
  var Backoff = require('./lib/backoff');
  var ExponentialBackoffStrategy = require('./lib/strategy/exponential');
  var FibonacciBackoffStrategy = require('./lib/strategy/fibonacci');
  var FunctionCall = require('./lib/function_call.js');
  
  module.exports.Backoff = Backoff;
  module.exports.FunctionCall = FunctionCall;
  module.exports.FibonacciStrategy = FibonacciBackoffStrategy;
  module.exports.ExponentialStrategy = ExponentialBackoffStrategy;
  
  // Constructs a Fibonacci backoff.
  module.exports.fibonacci = function(options) {
      return new Backoff(new FibonacciBackoffStrategy(options));
  };
  
  // Constructs an exponential backoff.
  module.exports.exponential = function(options) {
      return new Backoff(new ExponentialBackoffStrategy(options));
  };
  
  // Constructs a FunctionCall for the given function and arguments.
  module.exports.call = function(fn, vargs, callback) {
      var args = Array.prototype.slice.call(arguments);
      fn = args[0];
      vargs = args.slice(1, args.length - 1);
      callback = args[args.length - 1];
      return new FunctionCall(fn, vargs, callback);
  };
  
  },{"./lib/backoff":2,"./lib/function_call.js":3,"./lib/strategy/exponential":4,"./lib/strategy/fibonacci":5}],2:[function(require,module,exports){
  //      Copyright (c) 2012 Mathieu Turcotte
  //      Licensed under the MIT license.
  
  var events = require('events');
  var precond = require('precond');
  var util = require('util');
  
  // A class to hold the state of a backoff operation. Accepts a backoff strategy
  // to generate the backoff delays.
  function Backoff(backoffStrategy) {
      events.EventEmitter.call(this);
  
      this.backoffStrategy_ = backoffStrategy;
      this.maxNumberOfRetry_ = -1;
      this.backoffNumber_ = 0;
      this.backoffDelay_ = 0;
      this.timeoutID_ = -1;
  
      this.handlers = {
          backoff: this.onBackoff_.bind(this)
      };
  }
  util.inherits(Backoff, events.EventEmitter);
  
  // Sets a limit, greater than 0, on the maximum number of backoffs. A 'fail'
  // event will be emitted when the limit is reached.
  Backoff.prototype.failAfter = function(maxNumberOfRetry) {
      precond.checkArgument(maxNumberOfRetry > 0,
          'Expected a maximum number of retry greater than 0 but got %s.',
          maxNumberOfRetry);
  
      this.maxNumberOfRetry_ = maxNumberOfRetry;
  };
  
  // Starts a backoff operation. Accepts an optional parameter to let the
  // listeners know why the backoff operation was started.
  Backoff.prototype.backoff = function(err) {
      precond.checkState(this.timeoutID_ === -1, 'Backoff in progress.');
  
      if (this.backoffNumber_ === this.maxNumberOfRetry_) {
          this.emit('fail', err);
          this.reset();
      } else {
          this.backoffDelay_ = this.backoffStrategy_.next();
          this.timeoutID_ = setTimeout(this.handlers.backoff, this.backoffDelay_);
          this.emit('backoff', this.backoffNumber_, this.backoffDelay_, err);
      }
  };
  
  // Handles the backoff timeout completion.
  Backoff.prototype.onBackoff_ = function() {
      this.timeoutID_ = -1;
      this.emit('ready', this.backoffNumber_, this.backoffDelay_);
      this.backoffNumber_++;
  };
  
  // Stops any backoff operation and resets the backoff delay to its inital value.
  Backoff.prototype.reset = function() {
      this.backoffNumber_ = 0;
      this.backoffStrategy_.reset();
      clearTimeout(this.timeoutID_);
      this.timeoutID_ = -1;
  };
  
  module.exports = Backoff;
  
  },{"events":7,"precond":9,"util":14}],3:[function(require,module,exports){
  //      Copyright (c) 2012 Mathieu Turcotte
  //      Licensed under the MIT license.
  
  var events = require('events');
  var precond = require('precond');
  var util = require('util');
  
  var Backoff = require('./backoff');
  var FibonacciBackoffStrategy = require('./strategy/fibonacci');
  
  // Wraps a function to be called in a backoff loop.
  function FunctionCall(fn, args, callback) {
      events.EventEmitter.call(this);
  
      precond.checkIsFunction(fn, 'Expected fn to be a function.');
      precond.checkIsArray(args, 'Expected args to be an array.');
      precond.checkIsFunction(callback, 'Expected callback to be a function.');
  
      this.function_ = fn;
      this.arguments_ = args;
      this.callback_ = callback;
      this.lastResult_ = [];
      this.numRetries_ = 0;
  
      this.backoff_ = null;
      this.strategy_ = null;
      this.failAfter_ = -1;
  
      this.state_ = FunctionCall.State_.PENDING;
  }
  util.inherits(FunctionCall, events.EventEmitter);
  
  // States in which the call can be.
  FunctionCall.State_ = {
      // Call isn't started yet.
      PENDING: 0,
      // Call is in progress.
      RUNNING: 1,
      // Call completed successfully which means that either the wrapped function
      // returned successfully or the maximal number of backoffs was reached.
      COMPLETED: 2,
      // The call was aborted.
      ABORTED: 3
  };
  
  // Checks whether the call is pending.
  FunctionCall.prototype.isPending = function() {
      return this.state_ == FunctionCall.State_.PENDING;
  };
  
  // Checks whether the call is in progress.
  FunctionCall.prototype.isRunning = function() {
      return this.state_ == FunctionCall.State_.RUNNING;
  };
  
  // Checks whether the call is completed.
  FunctionCall.prototype.isCompleted = function() {
      return this.state_ == FunctionCall.State_.COMPLETED;
  };
  
  // Checks whether the call is aborted.
  FunctionCall.prototype.isAborted = function() {
      return this.state_ == FunctionCall.State_.ABORTED;
  };
  
  // Sets the backoff strategy to use. Can only be called before the call is
  // started otherwise an exception will be thrown.
  FunctionCall.prototype.setStrategy = function(strategy) {
      precond.checkState(this.isPending(), 'FunctionCall in progress.');
      this.strategy_ = strategy;
      return this; // Return this for chaining.
  };
  
  // Returns all intermediary results returned by the wrapped function since
  // the initial call.
  FunctionCall.prototype.getLastResult = function() {
      return this.lastResult_.concat();
  };
  
  // Returns the number of times the wrapped function call was retried.
  FunctionCall.prototype.getNumRetries = function() {
      return this.numRetries_;
  };
  
  // Sets the backoff limit.
  FunctionCall.prototype.failAfter = function(maxNumberOfRetry) {
      precond.checkState(this.isPending(), 'FunctionCall in progress.');
      this.failAfter_ = maxNumberOfRetry;
      return this; // Return this for chaining.
  };
  
  // Aborts the call.
  FunctionCall.prototype.abort = function() {
      precond.checkState(!this.isCompleted(), 'FunctionCall already completed.');
  
      if (this.isRunning()) {
          this.backoff_.reset();
      }
  
      this.state_ = FunctionCall.State_.ABORTED;
  };
  
  // Initiates the call to the wrapped function. Accepts an optional factory
  // function used to create the backoff instance; used when testing.
  FunctionCall.prototype.start = function(backoffFactory) {
      precond.checkState(!this.isAborted(), 'FunctionCall aborted.');
      precond.checkState(this.isPending(), 'FunctionCall already started.');
  
      var strategy = this.strategy_ || new FibonacciBackoffStrategy();
  
      this.backoff_ = backoffFactory ?
          backoffFactory(strategy) :
          new Backoff(strategy);
  
      this.backoff_.on('ready', this.doCall_.bind(this, true /* isRetry */));
      this.backoff_.on('fail', this.doCallback_.bind(this));
      this.backoff_.on('backoff', this.handleBackoff_.bind(this));
  
      if (this.failAfter_ > 0) {
          this.backoff_.failAfter(this.failAfter_);
      }
  
      this.state_ = FunctionCall.State_.RUNNING;
      this.doCall_(false /* isRetry */);
  };
  
  // Calls the wrapped function.
  FunctionCall.prototype.doCall_ = function(isRetry) {
      if (isRetry) {
          this.numRetries_++;
      }
      var eventArgs = ['call'].concat(this.arguments_);
      events.EventEmitter.prototype.emit.apply(this, eventArgs);
      var callback = this.handleFunctionCallback_.bind(this);
      this.function_.apply(null, this.arguments_.concat(callback));
  };
  
  // Calls the wrapped function's callback with the last result returned by the
  // wrapped function.
  FunctionCall.prototype.doCallback_ = function() {
      this.callback_.apply(null, this.lastResult_);
  };
  
  // Handles wrapped function's completion. This method acts as a replacement
  // for the original callback function.
  FunctionCall.prototype.handleFunctionCallback_ = function() {
      if (this.isAborted()) {
          return;
      }
  
      var args = Array.prototype.slice.call(arguments);
      this.lastResult_ = args; // Save last callback arguments.
      events.EventEmitter.prototype.emit.apply(this, ['callback'].concat(args));
  
      if (args[0]) {
          this.backoff_.backoff(args[0]);
      } else {
          this.state_ = FunctionCall.State_.COMPLETED;
          this.doCallback_();
      }
  };
  
  // Handles the backoff event by reemitting it.
  FunctionCall.prototype.handleBackoff_ = function(number, delay, err) {
      this.emit('backoff', number, delay, err);
  };
  
  module.exports = FunctionCall;
  
  },{"./backoff":2,"./strategy/fibonacci":5,"events":7,"precond":9,"util":14}],4:[function(require,module,exports){
  //      Copyright (c) 2012 Mathieu Turcotte
  //      Licensed under the MIT license.
  
  var util = require('util');
  var precond = require('precond');
  
  var BackoffStrategy = require('./strategy');
  
  // Exponential backoff strategy.
  function ExponentialBackoffStrategy(options) {
      BackoffStrategy.call(this, options);
      this.backoffDelay_ = 0;
      this.nextBackoffDelay_ = this.getInitialDelay();
      this.factor_ = ExponentialBackoffStrategy.DEFAULT_FACTOR;
  
      if (options && options.factor !== undefined) {
          precond.checkArgument(options.factor > 1,
              'Exponential factor should be greater than 1 but got %s.',
              options.factor);
          this.factor_ = options.factor;
      }
  }
  util.inherits(ExponentialBackoffStrategy, BackoffStrategy);
  
  // Default multiplication factor used to compute the next backoff delay from
  // the current one. The value can be overridden by passing a custom factor as
  // part of the options.
  ExponentialBackoffStrategy.DEFAULT_FACTOR = 2;
  
  ExponentialBackoffStrategy.prototype.next_ = function() {
      this.backoffDelay_ = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
      this.nextBackoffDelay_ = this.backoffDelay_ * this.factor_;
      return this.backoffDelay_;
  };
  
  ExponentialBackoffStrategy.prototype.reset_ = function() {
      this.backoffDelay_ = 0;
      this.nextBackoffDelay_ = this.getInitialDelay();
  };
  
  module.exports = ExponentialBackoffStrategy;
  
  },{"./strategy":6,"precond":9,"util":14}],5:[function(require,module,exports){
  //      Copyright (c) 2012 Mathieu Turcotte
  //      Licensed under the MIT license.
  
  var util = require('util');
  
  var BackoffStrategy = require('./strategy');
  
  // Fibonacci backoff strategy.
  function FibonacciBackoffStrategy(options) {
      BackoffStrategy.call(this, options);
      this.backoffDelay_ = 0;
      this.nextBackoffDelay_ = this.getInitialDelay();
  }
  util.inherits(FibonacciBackoffStrategy, BackoffStrategy);
  
  FibonacciBackoffStrategy.prototype.next_ = function() {
      var backoffDelay = Math.min(this.nextBackoffDelay_, this.getMaxDelay());
      this.nextBackoffDelay_ += this.backoffDelay_;
      this.backoffDelay_ = backoffDelay;
      return backoffDelay;
  };
  
  FibonacciBackoffStrategy.prototype.reset_ = function() {
      this.nextBackoffDelay_ = this.getInitialDelay();
      this.backoffDelay_ = 0;
  };
  
  module.exports = FibonacciBackoffStrategy;
  
  },{"./strategy":6,"util":14}],6:[function(require,module,exports){
  //      Copyright (c) 2012 Mathieu Turcotte
  //      Licensed under the MIT license.
  
  var events = require('events');
  var util = require('util');
  
  function isDef(value) {
      return value !== undefined && value !== null;
  }
  
  // Abstract class defining the skeleton for the backoff strategies. Accepts an
  // object holding the options for the backoff strategy:
  //
  //  * `randomisationFactor`: The randomisation factor which must be between 0
  //     and 1 where 1 equates to a randomization factor of 100% and 0 to no
  //     randomization.
  //  * `initialDelay`: The backoff initial delay in milliseconds.
  //  * `maxDelay`: The backoff maximal delay in milliseconds.
  function BackoffStrategy(options) {
      options = options || {};
  
      if (isDef(options.initialDelay) && options.initialDelay < 1) {
          throw new Error('The initial timeout must be greater than 0.');
      } else if (isDef(options.maxDelay) && options.maxDelay < 1) {
          throw new Error('The maximal timeout must be greater than 0.');
      }
  
      this.initialDelay_ = options.initialDelay || 100;
      this.maxDelay_ = options.maxDelay || 10000;
  
      if (this.maxDelay_ <= this.initialDelay_) {
          throw new Error('The maximal backoff delay must be ' +
                          'greater than the initial backoff delay.');
      }
  
      if (isDef(options.randomisationFactor) &&
          (options.randomisationFactor < 0 || options.randomisationFactor > 1)) {
          throw new Error('The randomisation factor must be between 0 and 1.');
      }
  
      this.randomisationFactor_ = options.randomisationFactor || 0;
  }
  
  // Gets the maximal backoff delay.
  BackoffStrategy.prototype.getMaxDelay = function() {
      return this.maxDelay_;
  };
  
  // Gets the initial backoff delay.
  BackoffStrategy.prototype.getInitialDelay = function() {
      return this.initialDelay_;
  };
  
  // Template method that computes and returns the next backoff delay in
  // milliseconds.
  BackoffStrategy.prototype.next = function() {
      var backoffDelay = this.next_();
      var randomisationMultiple = 1 + Math.random() * this.randomisationFactor_;
      var randomizedDelay = Math.round(backoffDelay * randomisationMultiple);
      return randomizedDelay;
  };
  
  // Computes and returns the next backoff delay. Intended to be overridden by
  // subclasses.
  BackoffStrategy.prototype.next_ = function() {
      throw new Error('BackoffStrategy.next_() unimplemented.');
  };
  
  // Template method that resets the backoff delay to its initial value.
  BackoffStrategy.prototype.reset = function() {
      this.reset_();
  };
  
  // Resets the backoff delay to its initial value. Intended to be overridden by
  // subclasses.
  BackoffStrategy.prototype.reset_ = function() {
      throw new Error('BackoffStrategy.reset_() unimplemented.');
  };
  
  module.exports = BackoffStrategy;
  
  },{"events":7,"util":14}],7:[function(require,module,exports){
  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
  function EventEmitter() {
    this._events = this._events || {};
    this._maxListeners = this._maxListeners || undefined;
  }
  module.exports = EventEmitter;
  
  // Backwards-compat with node 0.10.x
  EventEmitter.EventEmitter = EventEmitter;
  
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined;
  
  // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.
  EventEmitter.defaultMaxListeners = 10;
  
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.prototype.setMaxListeners = function(n) {
    if (!isNumber(n) || n < 0 || isNaN(n))
      throw TypeError('n must be a positive number');
    this._maxListeners = n;
    return this;
  };
  
  EventEmitter.prototype.emit = function(type) {
    var er, handler, len, args, i, listeners;
  
    if (!this._events)
      this._events = {};
  
    // If there is no 'error' event listener then throw.
    if (type === 'error') {
      if (!this._events.error ||
          (isObject(this._events.error) && !this._events.error.length)) {
        er = arguments[1];
        if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        }
        throw TypeError('Uncaught, unspecified "error" event.');
      }
    }
  
    handler = this._events[type];
  
    if (isUndefined(handler))
      return false;
  
    if (isFunction(handler)) {
      switch (arguments.length) {
        // fast cases
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        // slower
        default:
          args = Array.prototype.slice.call(arguments, 1);
          handler.apply(this, args);
      }
    } else if (isObject(handler)) {
      args = Array.prototype.slice.call(arguments, 1);
      listeners = handler.slice();
      len = listeners.length;
      for (i = 0; i < len; i++)
        listeners[i].apply(this, args);
    }
  
    return true;
  };
  
  EventEmitter.prototype.addListener = function(type, listener) {
    var m;
  
    if (!isFunction(listener))
      throw TypeError('listener must be a function');
  
    if (!this._events)
      this._events = {};
  
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (this._events.newListener)
      this.emit('newListener', type,
                isFunction(listener.listener) ?
                listener.listener : listener);
  
    if (!this._events[type])
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    else if (isObject(this._events[type]))
      // If we've already got an array, just append.
      this._events[type].push(listener);
    else
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
  
    // Check for listener leak
    if (isObject(this._events[type]) && !this._events[type].warned) {
      if (!isUndefined(this._maxListeners)) {
        m = this._maxListeners;
      } else {
        m = EventEmitter.defaultMaxListeners;
      }
  
      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        if (typeof console.trace === 'function') {
          // not supported in IE 10
          console.trace();
        }
      }
    }
  
    return this;
  };
  
  EventEmitter.prototype.on = EventEmitter.prototype.addListener;
  
  EventEmitter.prototype.once = function(type, listener) {
    if (!isFunction(listener))
      throw TypeError('listener must be a function');
  
    var fired = false;
  
    function g() {
      this.removeListener(type, g);
  
      if (!fired) {
        fired = true;
        listener.apply(this, arguments);
      }
    }
  
    g.listener = listener;
    this.on(type, g);
  
    return this;
  };
  
  // emits a 'removeListener' event iff the listener was removed
  EventEmitter.prototype.removeListener = function(type, listener) {
    var list, position, length, i;
  
    if (!isFunction(listener))
      throw TypeError('listener must be a function');
  
    if (!this._events || !this._events[type])
      return this;
  
    list = this._events[type];
    length = list.length;
    position = -1;
  
    if (list === listener ||
        (isFunction(list.listener) && list.listener === listener)) {
      delete this._events[type];
      if (this._events.removeListener)
        this.emit('removeListener', type, listener);
  
    } else if (isObject(list)) {
      for (i = length; i-- > 0;) {
        if (list[i] === listener ||
            (list[i].listener && list[i].listener === listener)) {
          position = i;
          break;
        }
      }
  
      if (position < 0)
        return this;
  
      if (list.length === 1) {
        list.length = 0;
        delete this._events[type];
      } else {
        list.splice(position, 1);
      }
  
      if (this._events.removeListener)
        this.emit('removeListener', type, listener);
    }
  
    return this;
  };
  
  EventEmitter.prototype.removeAllListeners = function(type) {
    var key, listeners;
  
    if (!this._events)
      return this;
  
    // not listening for removeListener, no need to emit
    if (!this._events.removeListener) {
      if (arguments.length === 0)
        this._events = {};
      else if (this._events[type])
        delete this._events[type];
      return this;
    }
  
    // emit removeListener for all listeners on all events
    if (arguments.length === 0) {
      for (key in this._events) {
        if (key === 'removeListener') continue;
        this.removeAllListeners(key);
      }
      this.removeAllListeners('removeListener');
      this._events = {};
      return this;
    }
  
    listeners = this._events[type];
  
    if (isFunction(listeners)) {
      this.removeListener(type, listeners);
    } else if (listeners) {
      // LIFO order
      while (listeners.length)
        this.removeListener(type, listeners[listeners.length - 1]);
    }
    delete this._events[type];
  
    return this;
  };
  
  EventEmitter.prototype.listeners = function(type) {
    var ret;
    if (!this._events || !this._events[type])
      ret = [];
    else if (isFunction(this._events[type]))
      ret = [this._events[type]];
    else
      ret = this._events[type].slice();
    return ret;
  };
  
  EventEmitter.prototype.listenerCount = function(type) {
    if (this._events) {
      var evlistener = this._events[type];
  
      if (isFunction(evlistener))
        return 1;
      else if (evlistener)
        return evlistener.length;
    }
    return 0;
  };
  
  EventEmitter.listenerCount = function(emitter, type) {
    return emitter.listenerCount(type);
  };
  
  function isFunction(arg) {
    return typeof arg === 'function';
  }
  
  function isNumber(arg) {
    return typeof arg === 'number';
  }
  
  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }
  
  function isUndefined(arg) {
    return arg === void 0;
  }
  
  },{}],8:[function(require,module,exports){
  if (typeof Object.create === 'function') {
    // implementation from standard node.js 'util' module
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  } else {
    // old school shim for old browsers
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
  
  },{}],9:[function(require,module,exports){
  /*
   * Copyright (c) 2012 Mathieu Turcotte
   * Licensed under the MIT license.
   */
  
  module.exports = require('./lib/checks');
  },{"./lib/checks":10}],10:[function(require,module,exports){
  /*
   * Copyright (c) 2012 Mathieu Turcotte
   * Licensed under the MIT license.
   */
  
  var util = require('util');
  
  var errors = module.exports = require('./errors');
  
  function failCheck(ExceptionConstructor, callee, messageFormat, formatArgs) {
      messageFormat = messageFormat || '';
      var message = util.format.apply(this, [messageFormat].concat(formatArgs));
      var error = new ExceptionConstructor(message);
      Error.captureStackTrace(error, callee);
      throw error;
  }
  
  function failArgumentCheck(callee, message, formatArgs) {
      failCheck(errors.IllegalArgumentError, callee, message, formatArgs);
  }
  
  function failStateCheck(callee, message, formatArgs) {
      failCheck(errors.IllegalStateError, callee, message, formatArgs);
  }
  
  module.exports.checkArgument = function(value, message) {
      if (!value) {
          failArgumentCheck(arguments.callee, message,
              Array.prototype.slice.call(arguments, 2));
      }
  };
  
  module.exports.checkState = function(value, message) {
      if (!value) {
          failStateCheck(arguments.callee, message,
              Array.prototype.slice.call(arguments, 2));
      }
  };
  
  module.exports.checkIsDef = function(value, message) {
      if (value !== undefined) {
          return value;
      }
  
      failArgumentCheck(arguments.callee, message ||
          'Expected value to be defined but was undefined.',
          Array.prototype.slice.call(arguments, 2));
  };
  
  module.exports.checkIsDefAndNotNull = function(value, message) {
      // Note that undefined == null.
      if (value != null) {
          return value;
      }
  
      failArgumentCheck(arguments.callee, message ||
          'Expected value to be defined and not null but got "' +
          typeOf(value) + '".', Array.prototype.slice.call(arguments, 2));
  };
  
  // Fixed version of the typeOf operator which returns 'null' for null values
  // and 'array' for arrays.
  function typeOf(value) {
      var s = typeof value;
      if (s == 'object') {
          if (!value) {
              return 'null';
          } else if (value instanceof Array) {
              return 'array';
          }
      }
      return s;
  }
  
  function typeCheck(expect) {
      return function(value, message) {
          var type = typeOf(value);
  
          if (type == expect) {
              return value;
          }
  
          failArgumentCheck(arguments.callee, message ||
              'Expected "' + expect + '" but got "' + type + '".',
              Array.prototype.slice.call(arguments, 2));
      };
  }
  
  module.exports.checkIsString = typeCheck('string');
  module.exports.checkIsArray = typeCheck('array');
  module.exports.checkIsNumber = typeCheck('number');
  module.exports.checkIsBoolean = typeCheck('boolean');
  module.exports.checkIsFunction = typeCheck('function');
  module.exports.checkIsObject = typeCheck('object');
  
  },{"./errors":11,"util":14}],11:[function(require,module,exports){
  /*
   * Copyright (c) 2012 Mathieu Turcotte
   * Licensed under the MIT license.
   */
  
  var util = require('util');
  
  function IllegalArgumentError(message) {
      Error.call(this, message);
      this.message = message;
  }
  util.inherits(IllegalArgumentError, Error);
  
  IllegalArgumentError.prototype.name = 'IllegalArgumentError';
  
  function IllegalStateError(message) {
      Error.call(this, message);
      this.message = message;
  }
  util.inherits(IllegalStateError, Error);
  
  IllegalStateError.prototype.name = 'IllegalStateError';
  
  module.exports.IllegalStateError = IllegalStateError;
  module.exports.IllegalArgumentError = IllegalArgumentError;
  },{"util":14}],12:[function(require,module,exports){
  // shim for using process in browser
  
  var process = module.exports = {};
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;
  
  function cleanUpNextTick() {
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }
  
  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = setTimeout(cleanUpNextTick);
      draining = true;
  
      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      clearTimeout(timeout);
  }
  
  process.nextTick = function (fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          setTimeout(drainQueue, 0);
      }
  };
  
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = ''; // empty string to avoid regexp issues
  process.versions = {};
  
  function noop() {}
  
  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  
  process.binding = function (name) {
      throw new Error('process.binding is not supported');
  };
  
  process.cwd = function () { return '/' };
  process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
  };
  process.umask = function() { return 0; };
  
  },{}],13:[function(require,module,exports){
  module.exports = function isBuffer(arg) {
    return arg && typeof arg === 'object'
      && typeof arg.copy === 'function'
      && typeof arg.fill === 'function'
      && typeof arg.readUInt8 === 'function';
  }
  },{}],14:[function(require,module,exports){
  (function (process,global){
  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  
  var formatRegExp = /%[sdj%]/g;
  exports.format = function(f) {
    if (!isString(f)) {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }
  
    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function(x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s': return String(args[i++]);
        case '%d': return Number(args[i++]);
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  };
  
  
  // Mark that a method should not be used.
  // Returns a modified function which warns once by default.
  // If --no-deprecation is set, then it is a no-op.
  exports.deprecate = function(fn, msg) {
    // Allow for deprecating things in the process of starting up.
    if (isUndefined(global.process)) {
      return function() {
        return exports.deprecate(fn, msg).apply(this, arguments);
      };
    }
  
    if (process.noDeprecation === true) {
      return fn;
    }
  
    var warned = false;
    function deprecated() {
      if (!warned) {
        if (process.throwDeprecation) {
          throw new Error(msg);
        } else if (process.traceDeprecation) {
          console.trace(msg);
        } else {
          console.error(msg);
        }
        warned = true;
      }
      return fn.apply(this, arguments);
    }
  
    return deprecated;
  };
  
  
  var debugs = {};
  var debugEnviron;
  exports.debuglog = function(set) {
    if (isUndefined(debugEnviron))
      debugEnviron = process.env.NODE_DEBUG || '';
    set = set.toUpperCase();
    if (!debugs[set]) {
      if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
        var pid = process.pid;
        debugs[set] = function() {
          var msg = exports.format.apply(exports, arguments);
          console.error('%s %d: %s', set, pid, msg);
        };
      } else {
        debugs[set] = function() {};
      }
    }
    return debugs[set];
  };
  
  
  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */
  /* legacy: obj, showHidden, depth, colors*/
  function inspect(obj, opts) {
    // default options
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    };
    // legacy...
    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];
    if (isBoolean(opts)) {
      // legacy...
      ctx.showHidden = opts;
    } else if (opts) {
      // got an "options" object
      exports._extend(ctx, opts);
    }
    // set default options
    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined(ctx.depth)) ctx.depth = 2;
    if (isUndefined(ctx.colors)) ctx.colors = false;
    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  }
  exports.inspect = inspect;
  
  
  // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
  inspect.colors = {
    'bold' : [1, 22],
    'italic' : [3, 23],
    'underline' : [4, 24],
    'inverse' : [7, 27],
    'white' : [37, 39],
    'grey' : [90, 39],
    'black' : [30, 39],
    'blue' : [34, 39],
    'cyan' : [36, 39],
    'green' : [32, 39],
    'magenta' : [35, 39],
    'red' : [31, 39],
    'yellow' : [33, 39]
  };
  
  // Don't use 'blue' not visible on cmd.exe
  inspect.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intentionally not styling
    'regexp': 'red'
  };
  
  
  function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];
  
    if (style) {
      return '\u001b[' + inspect.colors[style][0] + 'm' + str +
             '\u001b[' + inspect.colors[style][1] + 'm';
    } else {
      return str;
    }
  }
  
  
  function stylizeNoColor(str, styleType) {
    return str;
  }
  
  
  function arrayToHash(array) {
    var hash = {};
  
    array.forEach(function(val, idx) {
      hash[val] = true;
    });
  
    return hash;
  }
  
  
  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect &&
        value &&
        isFunction(value.inspect) &&
        // Filter out the util module, it's inspect function is special
        value.inspect !== exports.inspect &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      var ret = value.inspect(recurseTimes, ctx);
      if (!isString(ret)) {
        ret = formatValue(ctx, ret, recurseTimes);
      }
      return ret;
    }
  
    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }
  
    // Look up the keys of the object.
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);
  
    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    }
  
    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (isError(value)
        && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
      return formatError(value);
    }
  
    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (isFunction(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }
  
    var base = '', array = false, braces = ['{', '}'];
  
    // Make Array say that they are Array
    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    }
  
    // Make functions say that they are functions
    if (isFunction(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }
  
    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }
  
    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }
  
    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }
  
    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }
  
    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }
  
    ctx.seen.push(value);
  
    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function(key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }
  
    ctx.seen.pop();
  
    return reduceToSingleString(output, base, braces);
  }
  
  
  function formatPrimitive(ctx, value) {
    if (isUndefined(value))
      return ctx.stylize('undefined', 'undefined');
    if (isString(value)) {
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    }
    if (isNumber(value))
      return ctx.stylize('' + value, 'number');
    if (isBoolean(value))
      return ctx.stylize('' + value, 'boolean');
    // For some reason typeof null is "object", so special case here.
    if (isNull(value))
      return ctx.stylize('null', 'null');
  }
  
  
  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }
  
  
  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
            String(i), true));
      } else {
        output.push('');
      }
    }
    keys.forEach(function(key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
            key, true));
      }
    });
    return output;
  }
  
  
  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }
    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }
        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function(line) {
              return '  ' + line;
            }).join('\n').substr(2);
          } else {
            str = '\n' + str.split('\n').map(function(line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }
    if (isUndefined(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'")
                   .replace(/\\"/g, '"')
                   .replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }
  
    return name + ': ' + str;
  }
  
  
  function reduceToSingleString(output, base, braces) {
    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);
  
    if (length > 60) {
      return braces[0] +
             (base === '' ? '' : base + '\n ') +
             ' ' +
             output.join(',\n  ') +
             ' ' +
             braces[1];
    }
  
    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }
  
  
  // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.
  function isArray(ar) {
    return Array.isArray(ar);
  }
  exports.isArray = isArray;
  
  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }
  exports.isBoolean = isBoolean;
  
  function isNull(arg) {
    return arg === null;
  }
  exports.isNull = isNull;
  
  function isNullOrUndefined(arg) {
    return arg == null;
  }
  exports.isNullOrUndefined = isNullOrUndefined;
  
  function isNumber(arg) {
    return typeof arg === 'number';
  }
  exports.isNumber = isNumber;
  
  function isString(arg) {
    return typeof arg === 'string';
  }
  exports.isString = isString;
  
  function isSymbol(arg) {
    return typeof arg === 'symbol';
  }
  exports.isSymbol = isSymbol;
  
  function isUndefined(arg) {
    return arg === void 0;
  }
  exports.isUndefined = isUndefined;
  
  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }
  exports.isRegExp = isRegExp;
  
  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }
  exports.isObject = isObject;
  
  function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
  }
  exports.isDate = isDate;
  
  function isError(e) {
    return isObject(e) &&
        (objectToString(e) === '[object Error]' || e instanceof Error);
  }
  exports.isError = isError;
  
  function isFunction(arg) {
    return typeof arg === 'function';
  }
  exports.isFunction = isFunction;
  
  function isPrimitive(arg) {
    return arg === null ||
           typeof arg === 'boolean' ||
           typeof arg === 'number' ||
           typeof arg === 'string' ||
           typeof arg === 'symbol' ||  // ES6 symbol
           typeof arg === 'undefined';
  }
  exports.isPrimitive = isPrimitive;
  
  exports.isBuffer = require('./support/isBuffer');
  
  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }
  
  
  function pad(n) {
    return n < 10 ? '0' + n.toString(10) : n.toString(10);
  }
  
  
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                'Oct', 'Nov', 'Dec'];
  
  // 26 Feb 16:19:34
  function timestamp() {
    var d = new Date();
    var time = [pad(d.getHours()),
                pad(d.getMinutes()),
                pad(d.getSeconds())].join(':');
    return [d.getDate(), months[d.getMonth()], time].join(' ');
  }
  
  
  // log is just a thin wrapper to console.log that prepends a timestamp
  exports.log = function() {
    console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
  };
  
  
  /**
   * Inherit the prototype methods from one constructor into another.
   *
   * The Function.prototype.inherits from lang.js rewritten as a standalone
   * function (not on Function.prototype). NOTE: If this file is to be loaded
   * during bootstrapping this function needs to be rewritten using some native
   * functions as prototype setup using normal JavaScript does not work as
   * expected during bootstrapping (see mirror.js in r114903).
   *
   * @param {function} ctor Constructor function which needs to inherit the
   *     prototype.
   * @param {function} superCtor Constructor function to inherit prototype from.
   */
  exports.inherits = require('inherits');
  
  exports._extend = function(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject(add)) return origin;
  
    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  };
  
  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  
  }).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
  },{"./support/isBuffer":13,"_process":12,"inherits":8}],15:[function(require,module,exports){
  'use strict';
  
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  
  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
  
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
  
  var backoff = require('backoff');
  
  var WebSocketClient = function () {
  
    /**
     * @param url DOMString The URL to which to connect; this should be the URL to which the WebSocket server will respond.
     * @param protocols DOMString|DOMString[] Either a single protocol string or an array of protocol strings. These strings are used to indicate sub-protocols, so that a single server can implement multiple WebSocket sub-protocols (for example, you might want one server to be able to handle different types of interactions depending on the specified protocol). If you don't specify a protocol string, an empty string is assumed.
     */
  
    function WebSocketClient(url, protocols) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
  
      _classCallCheck(this, WebSocketClient);
  
      this.url = url;
      this._protocols = protocols;
  
      this.reconnectEnabled = true;
      this.listeners = {};
  
      this.backoff = backoff[options.backoff || 'fibonacci'](options);
      this.backoff.on('backoff', this.onBackoffStart.bind(this));
      this.backoff.on('ready', this.onBackoffReady.bind(this));
      this.backoff.on('fail', this.onBackoffFail.bind(this));
  
      this.open();
    }
  
    _createClass(WebSocketClient, [{
      key: 'open',
      value: function open() {
        var reconnect = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
  
        this.isReconnect = reconnect;
        var binaryType = this.ws && this.ws.binaryType;
        this.ws = new WebSocket(this.url, this._protocols);
        this.ws.onclose = this.onCloseCallback.bind(this);
        this.ws.onerror = this.onErrorCallback.bind(this);
        this.ws.onmessage = this.onMessageCallback.bind(this);
        this.ws.onopen = this.onOpenCallback.bind(this);
        if (binaryType) {
          this.ws.binaryType = binaryType;
        }
      }
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onBackoffStart',
      value: function onBackoffStart(number, delay) {}
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onBackoffReady',
      value: function onBackoffReady(number, delay) {
        // console.log("onBackoffReady", number + ' ' + delay + 'ms');
        this.open(true);
      }
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onBackoffFail',
      value: function onBackoffFail() {}
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onCloseCallback',
      value: function onCloseCallback() {
        if (!this.isReconnect && this.listeners['onclose']) this.listeners['onclose'].apply(null, arguments);
        if (this.reconnectEnabled) {
          this.backoff.backoff();
        }
      }
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onErrorCallback',
      value: function onErrorCallback() {
        if (this.listeners['onerror']) this.listeners['onerror'].apply(null, arguments);
      }
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onMessageCallback',
      value: function onMessageCallback() {
        if (this.listeners['onmessage']) this.listeners['onmessage'].apply(null, arguments);
      }
  
      /**
       * @ignore
       */
  
    }, {
      key: 'onOpenCallback',
      value: function onOpenCallback() {
        if (this.listeners['onopen']) this.listeners['onopen'].apply(null, arguments);
        if (this.isReconnect && this.listeners['onreconnect']) this.listeners['onreconnect'].apply(null, arguments);
        this.isReconnect = false;
      }
  
      /**
       * The number of bytes of data that have been queued using calls to send()
       * but not yet transmitted to the network. This value does not reset to zero
       * when the connection is closed; if you keep calling send(), this will
       * continue to climb.
       *
       * @type unsigned long
       * @readonly
       */
  
    }, {
      key: 'close',
  
  
      /**
       * Closes the WebSocket connection or connection attempt, if any. If the
       * connection is already CLOSED, this method does nothing.
       *
       * @param code A numeric value indicating the status code explaining why the connection is being closed. If this parameter is not specified, a default value of 1000 (indicating a normal "transaction complete" closure) is assumed. See the list of status codes on the CloseEvent page for permitted values.
       * @param reason A human-readable string explaining why the connection is closing. This string must be no longer than 123 bytes of UTF-8 text (not characters).
       *
       * @return void
       */
      value: function close(code, reason) {
        if (typeof code == 'undefined') {
          code = 1000;
        }
  
        this.reconnectEnabled = false;
  
        this.ws.close(code, reason);
      }
  
      /**
       * Transmits data to the server over the WebSocket connection.
       * @param data DOMString|ArrayBuffer|Blob
       * @return void
       */
  
    }, {
      key: 'send',
      value: function send(data) {
        this.ws.send(data);
      }
  
      /**
       * An event listener to be called when the WebSocket connection's readyState changes to CLOSED. The listener receives a CloseEvent named "close".
       * @param listener EventListener
       */
  
    }, {
      key: 'bufferedAmount',
      get: function get() {
        return this.ws.bufferedAmount;
      }
  
      /**
       * The current state of the connection; this is one of the Ready state constants.
       * @type unsigned short
       * @readonly
       */
  
    }, {
      key: 'readyState',
      get: function get() {
        return this.ws.readyState;
      }
  
      /**
       * A string indicating the type of binary data being transmitted by the
       * connection. This should be either "blob" if DOM Blob objects are being
       * used or "arraybuffer" if ArrayBuffer objects are being used.
       * @type DOMString
       */
  
    }, {
      key: 'binaryType',
      get: function get() {
        return this.ws.binaryType;
      },
      set: function set(binaryType) {
        this.ws.binaryType = binaryType;
      }
  
      /**
       * The extensions selected by the server. This is currently only the empty
       * string or a list of extensions as negotiated by the connection.
       * @type DOMString
       */
  
    }, {
      key: 'extensions',
      get: function get() {
        return this.ws.extensions;
      },
      set: function set(extensions) {
        this.ws.extensions = extensions;
      }
  
      /**
       * A string indicating the name of the sub-protocol the server selected;
       * this will be one of the strings specified in the protocols parameter when
       * creating the WebSocket object.
       * @type DOMString
       */
  
    }, {
      key: 'protocol',
      get: function get() {
        return this.ws.protocol;
      },
      set: function set(protocol) {
        this.ws.protocol = protocol;
      }
    }, {
      key: 'onclose',
      set: function set(listener) {
        this.listeners['onclose'] = listener;
      },
      get: function get() {
        return this.listeners['onclose'];
      }
  
      /**
       * An event listener to be called when an error occurs. This is a simple event named "error".
       * @param listener EventListener
       */
  
    }, {
      key: 'onerror',
      set: function set(listener) {
        this.listeners['onerror'] = listener;
      },
      get: function get() {
        return this.listeners['onerror'];
      }
  
      /**
       * An event listener to be called when a message is received from the server. The listener receives a MessageEvent named "message".
       * @param listener EventListener
       */
  
    }, {
      key: 'onmessage',
      set: function set(listener) {
        this.listeners['onmessage'] = listener;
      },
      get: function get() {
        return this.listeners['onmessage'];
      }
  
      /**
       * An event listener to be called when the WebSocket connection's readyState changes to OPEN; this indicates that the connection is ready to send and receive data. The event is a simple one with the name "open".
       * @param listener EventListener
       */
  
    }, {
      key: 'onopen',
      set: function set(listener) {
        this.listeners['onopen'] = listener;
      },
      get: function get() {
        return this.listeners['onopen'];
      }
  
      /**
       * @param listener EventListener
       */
  
    }, {
      key: 'onreconnect',
      set: function set(listener) {
        this.listeners['onreconnect'] = listener;
      },
      get: function get() {
        return this.listeners['onreconnect'];
      }
    }]);
  
    return WebSocketClient;
  }();
  
  /**
   * The connection is not yet open.
   */
  
  
  WebSocketClient.CONNECTING = WebSocket.CONNECTING;
  
  /**
   * The connection is open and ready to communicate.
   */
  WebSocketClient.OPEN = WebSocket.OPEN;
  
  /**
   * The connection is in the process of closing.
   */
  WebSocketClient.CLOSING = WebSocket.CLOSING;
  
  /**
   * The connection is closed or couldn't be opened.
   */
  WebSocketClient.CLOSED = WebSocket.CLOSED;
  
  exports.default = WebSocketClient;
  
  },{"backoff":1}]},{},[15])(15)
  });

define('lib/utility',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getParameterByName(name) {
        var url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    exports.getParameterByName = getParameterByName;
});



define('lib/util',["require", "exports", "../model/chip", "../shared/Currency", "../shared/Currency", "../shared/decimal", "../shared/CommonHelpers", "../shared/TournmanetStatus"], function (require, exports, chip_1, Currency_1, Currency_2, decimal_1, CommonHelpers_1, TournmanetStatus_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Util = (function () {
        function Util() {
            this.tableConfigs = [];
            this.chips1 = [25, 10, 5, 1];
            this.chips2 = [250, 100, 50, 25, 10, 5, 1];
            this.chips3 = [250, 100, 50, 25, 20, 10, 5, 1];
            this.chips4 = [10000, 5000, 2000, 1000, 500, 250, 100, 50, 25, 20, 10, 5, 1];
            this.chipsets = [this.chips1, this.chips2, this.chips3, this.chips4];
            this.audio = [];
        }
        Util.prototype.setCurrentTableId = function (value) {
            this.currentTableId = value;
        };
        Util.prototype.toDisplayAmount = function (amount, tableConfig) {
            if (!amount && amount !== 0)
                return '';
            if (!tableConfig)
                tableConfig = this.currentTableConfig;
            if (tableConfig) {
                if (tableConfig.currency == Currency_2.Currency.tournament) {
                    return CommonHelpers_1.numberWithCommas(amount);
                }
                else {
                    return this.formatNumber(this.toUsd(amount, tableConfig.exchangeRate, tableConfig.currency));
                }
            }
            return this.formatNumber(amount / 100);
        };
        Util.prototype.toUsd = function (amount, exchangeRate, currency) {
            var currencyUnit = Currency_1.CurrencyUnit.getCurrencyUnit(currency);
            var convertedAmount = (amount / currencyUnit * exchangeRate);
            return convertedAmount;
        };
        Util.prototype.fromDisplayAmount = function (text) {
            var amount = this.parseAmount(text);
            var tableConfig = this.currentTableConfig;
            if (tableConfig) {
                var currencyUnit = Currency_1.CurrencyUnit.getCurrencyUnit(tableConfig.currency);
                amount = Math.floor(amount / tableConfig.exchangeRate * currencyUnit);
            }
            return amount;
        };
        Util.prototype.getCryptoCurrencies = function () {
            return this.tableConfigs.map(function (c) { return c.currency; }).filter(function (v, i, a) { return v != Currency_2.Currency.free && v != Currency_2.Currency.tournament && a.indexOf(v) === i; });
        };
        Util.prototype.parseAmount = function (text) {
            return parseFloat(text.replace(',', '').replace('$', ''));
        };
        Util.prototype.formatNumber = function (amount, currency) {
            if (currency === void 0) { currency = null; }
            if (amount === undefined) {
                return '';
            }
            if (!currency || currency === "usd") {
                currency = "$";
                if (parseFloat(amount.toFixed(2)) < 0.01)
                    amount = 0;
            }
            if (amount == null)
                return '';
            if (typeof (amount) === 'string') {
                amount = new decimal_1.Decimal(amount).toNumber();
            }
            return currency + CommonHelpers_1.numberWithCommas(amount.toFixed(2));
        };
        Util.prototype.getStatusLabel = function (game, playerSitting, playerSeat, seats, gameStarting, isTournament) {
            var label = '';
            if (game && game.potResults && game.potResults.length) {
                if (game.potResults.length === 1) {
                    label = this.getPotWinnerSummary(game.potResults[0], seats);
                }
                else {
                    for (var i = 0; i < game.potResults.length; i++) {
                        label += "<span class=\"multi-pot-result\">Pot " + (i + 1) + ": " + this.getPotWinnerSummary(game.potResults[i], seats) + '</span>';
                        if (i !== game.potResults.length - 1)
                            label += "</br>";
                    }
                }
                return label;
            }
            if (playerSitting) {
                var player = this.getPlayersTurn(seats);
                if (player) {
                    if (player.seatIndex !== playerSeat) {
                        label = "Waiting for " + player.name;
                    }
                }
                else {
                    if (!game || (!game.pot.length && !gameStarting.isStarting)) {
                        if (isTournament) {
                            label = this.getTournamentLabel(seats, playerSeat, gameStarting);
                        }
                        else {
                            label = 'Waiting for other players to join.';
                        }
                    }
                }
            }
            else {
                if (isTournament) {
                    label = this.getTournamentLabel(seats, playerSeat, gameStarting);
                }
                else {
                    label = 'Choose a seat to join the table.';
                }
            }
            return label;
        };
        Util.prototype.getTournamentLabel = function (seats, playerSeat, gameStarting) {
            if (seats.filter(function (s) { return !s.empty; }).length) {
                var player = this.getPlayersTurn(seats);
                if (player) {
                    if (player.seatIndex !== playerSeat) {
                        return "Waiting for " + player.name;
                    }
                }
                else if (!gameStarting.isStarting) {
                    return 'Waiting on other tables.';
                }
            }
            else {
                return 'Table closed';
            }
        };
        Util.prototype.getPotWinnerSummary = function (potResult, seats) {
            var summary = '';
            if (potResult.seatWinners.length === 1) {
                summary = seats[potResult.seatWinners[0]].name + " wins!";
            }
            else if (potResult.seatWinners.length > 1) {
                summary = "Split Pot: Seats ";
                for (var i = 0; i < potResult.seatWinners.length; i++) {
                    summary += seats[potResult.seatWinners[i]].name;
                    if (i != potResult.seatWinners.length - 1)
                        summary += " & ";
                }
            }
            else {
                console.log('invalid pot result!', potResult);
            }
            if (potResult.winningHand)
                summary += " - " + potResult.winningHand;
            return summary;
        };
        Util.prototype.getNumPlayers = function (seats) {
            var count = 0;
            for (var i = 0; i < seats.length; i++) {
                if (!seats[i].empty) {
                    count++;
                }
            }
            return count;
        };
        Util.prototype.fromSmallest = function (amount, currency) {
            if (currency.toLowerCase() === "usd") {
                return this.formatNumber(amount, currency);
            }
            var currencyUnit = Currency_1.CurrencyUnit.getCurrencyUnit(currency);
            return this.numberToString(amount / currencyUnit);
        };
        Util.prototype.formatAmountWithUsd = function (amount, currency, amountUsd) {
            if (currency.toLowerCase() === "usd") {
                return this.formatNumber(amount / 100, currency);
            }
            else {
                var currencyUnit = Currency_1.CurrencyUnit.getCurrencyUnit(currency);
                var rawAmt = amount / currencyUnit;
                var rawRounded = Math.round(rawAmt * 1000000) / 1000000;
                var approxLabel = rawAmt != rawRounded ? "~" : "";
                var amountUsdStr = this.formatNumber(amountUsd, 'usd');
                return "" + approxLabel + rawRounded + " (" + amountUsdStr + ")";
            }
        };
        Util.prototype.getPlayersTurn = function (seats) {
            for (var i = 0; i < seats.length; i++) {
                if (seats[i].myturn) {
                    return seats[i];
                }
            }
            return null;
        };
        Util.prototype.notify = function (text) {
            return this.requestNotificationPermission()
                .then(function (permission) {
                if (permission === 'granted') {
                    var notification = new Notification(text, { icon: '/images/logo_icon_only.png' });
                    return notification;
                }
            });
        };
        Util.prototype.requestNotificationPermission = function () {
            return new Promise(function (resolve, reject) {
                if (typeof Notification !== 'undefined') {
                    Notification.requestPermission(function (permission) {
                        return resolve(permission);
                    });
                }
                else {
                    return resolve('');
                }
            });
        };
        Util.prototype.numberToString = function (num) {
            var numStr = String(num);
            if (Math.abs(num) < 1.0) {
                var e = parseInt(num.toString().split('e-')[1]);
                if (e) {
                    var negative = num < 0;
                    if (negative)
                        num *= -1;
                    num *= Math.pow(10, e - 1);
                    numStr = '0.' + (new Array(e)).join('0') + num.toString().substring(2);
                    if (negative)
                        numStr = "-" + numStr;
                }
            }
            else {
                var e = parseInt(num.toString().split('+')[1]);
                if (e > 20) {
                    e -= 20;
                    num /= Math.pow(10, e);
                    numStr = num.toString() + (new Array(e + 1)).join('0');
                }
            }
            return numStr;
        };
        Util.prototype.getChips = function (index, amount, chipDataFunc, callContext) {
            var tableConfig = this.currentTableConfig;
            if (!tableConfig)
                return [];
            var adjustedBet = Math.round(amount / tableConfig.smallBlind);
            var bet = adjustedBet;
            var betStacks = null;
            for (var k = 0; k < this.chipsets.length; k++) {
                betStacks = this.getStacks(bet, this.chipsets[k]);
                if (betStacks !== false) {
                    break;
                }
            }
            if (!betStacks) {
                betStacks = [[10000, 10], [5000, 8], [2000, 6], [1000, 4], [500, 2]];
            }
            betStacks.sort(function (a, b) {
                return (a[1] - b[1]);
            });
            betStacks.reverse();
            var chips = [];
            for (var j = 0; j < betStacks.length && j < 5; j++) {
                chips = chips.concat(chipDataFunc.call(callContext, index, j, betStacks[j][0], betStacks[j][1]));
            }
            return chips;
        };
        Util.prototype.getStacks = function (thisBet, chips) {
            var thisBetStack = [];
            for (var i = 0; i < chips.length; i++) {
                var chipval = chips[i];
                if (thisBet / chipval >= 1) {
                    if (Math.floor(thisBet / chipval) > 10) {
                        return false;
                    }
                    thisBetStack.push([chipval, Math.floor(thisBet / chipval)]);
                    thisBet %= chipval;
                }
            }
            return thisBetStack;
        };
        Util.prototype.getChip = function (chipnum, left, top, extraClass) {
            var chip = new chip_1.Chip();
            extraClass = extraClass ? extraClass : '';
            chip.classes = 'chip chip' + chipnum + ' ' + extraClass;
            chip.top = top;
            chip.left = left;
            return chip;
        };
        Util.prototype.dealCard = function (card, pLeft, pTop, startWidth, endWidth, $, dealspeed, origin, onAnimationComplete) {
            var dealElement = $("<div class=\"sprite sprite-" + card + "-150\">");
            dealElement.css({ 'position': 'absolute', 'top': origin[0], 'left': origin[1], 'width': startWidth });
            $('#poker-room').append(dealElement);
            dealElement.animate({ 'left': pLeft, 'top': pTop, 'width': endWidth }, dealspeed, "linear", function () {
                dealElement.remove();
                if (onAnimationComplete)
                    onAnimationComplete();
            });
        };
        Util.prototype.playSound = function (src) {
            if (this.user && this.user.muteSounds) {
                return;
            }
            var audioElem = this.audio.find(function (a) { return a.src.endsWith(src); });
            if (audioElem)
                audioElem.play();
        };
        Util.prototype.getCookie = function (name) {
            var value = "; " + document.cookie;
            var parts = value.split("; " + name + "=");
            if (parts.length === 2)
                return parts.pop().split(";").shift();
            return '';
        };
        Util.prototype.createCookie = function (name, value, days) {
            var expires = '';
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            else {
                expires = "";
            }
            document.cookie = name + "=" + value + expires + "; path=/";
        };
        Util.prototype.canRegister = function (tournament) {
            if (!tournament.joined) {
                if (!tournament.status) {
                    return { success: true };
                }
                else if (tournament.status == TournmanetStatus_1.TournmanetStatus.Started && tournament.lateRegistrationMin) {
                    var startTime = new Date(tournament.startTime);
                    var cutOff = new Date(startTime.getTime() + tournament.lateRegistrationMin * 60 * 1000);
                    var beforeCutoff = cutOff.getTime() - new Date().getTime();
                    if (beforeCutoff > 0) {
                        return { success: true, isLate: true };
                    }
                }
            }
            return { success: false };
        };
        Util.prototype.canLateRegister = function (tournament) {
        };
        return Util;
    }());
    exports.Util = Util;
});



define('lib/payment-type-abbrev',["require", "exports", "../shared/PaymentType"], function (require, exports, PaymentType_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PaymentTypeAbbrevValueConverter = (function () {
        function PaymentTypeAbbrevValueConverter() {
        }
        PaymentTypeAbbrevValueConverter.prototype.toView = function (value) {
            if (value == PaymentType_1.PaymentType.outgoing) {
                return 'Out';
            }
            else if (value == PaymentType_1.PaymentType.incoming) {
                return 'In';
            }
            return value;
        };
        return PaymentTypeAbbrevValueConverter;
    }());
    exports.PaymentTypeAbbrevValueConverter = PaymentTypeAbbrevValueConverter;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('lib/number-format',["require", "exports", "aurelia-framework", "./util"], function (require, exports, aurelia_framework_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NumberFormatValueConverter = (function () {
        function NumberFormatValueConverter(util) {
            this.util = util;
        }
        NumberFormatValueConverter.prototype.toView = function (value, format) {
            var tableConfig = typeof format === 'object' ? format : null;
            if (format === 'usd')
                return this.util.formatNumber(value);
            else
                return this.util.toDisplayAmount(value, tableConfig);
        };
        NumberFormatValueConverter = __decorate([
            aurelia_framework_1.inject(util_1.Util),
            __metadata("design:paramtypes", [util_1.Util])
        ], NumberFormatValueConverter);
        return NumberFormatValueConverter;
    }());
    exports.NumberFormatValueConverter = NumberFormatValueConverter;
});



define('lib/local-date',["require", "exports", "moment"], function (require, exports, moment) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LocalDateValueConverter = (function () {
        function LocalDateValueConverter() {
        }
        LocalDateValueConverter.prototype.toView = function (value, format) {
            if (value && typeof (value) === 'string') {
                if (!format) {
                    format = 'D MMM HH:mm';
                }
                return moment(value).format(format);
            }
            return '';
        };
        return LocalDateValueConverter;
    }());
    exports.LocalDateValueConverter = LocalDateValueConverter;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('lib/crypto-format',["require", "exports", "aurelia-framework", "./util"], function (require, exports, aurelia_framework_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CryptoFormatValueConverter = (function () {
        function CryptoFormatValueConverter(util) {
            this.util = util;
        }
        CryptoFormatValueConverter.prototype.toView = function (value, format) {
            if (!value && value !== 0)
                return '';
            if (!format)
                format = this.util.currentTableConfig.currency;
            return this.util.fromSmallest(value, format) + '';
        };
        CryptoFormatValueConverter = __decorate([
            aurelia_framework_1.inject(util_1.Util),
            __metadata("design:paramtypes", [util_1.Util])
        ], CryptoFormatValueConverter);
        return CryptoFormatValueConverter;
    }());
    exports.CryptoFormatValueConverter = CryptoFormatValueConverter;
});



define('lib/constants',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Constants = (function () {
        function Constants() {
            this.dealwidth = 30;
            this.origin = [55, 385];
            this.p0 = [[494, 90], [475, 92], [488, 106], [507, 104], [470, 108]];
            this.p1 = [[644, 132], [630, 142], [648, 149], [631, 160], [647, 167]];
            this.p2 = [[644, 257], [630, 267], [648, 274], [631, 285], [647, 292]];
            this.p3 = [[582, 333], [565, 328], [599, 328], [549, 333], [616, 333]];
            this.p4 = [[395, 345], [378, 340], [412, 340], [362, 345], [429, 345]];
            this.p5 = [[208, 333], [191, 328], [225, 328], [175, 333], [242, 333]];
            this.p6 = [[145, 257], [159, 267], [141, 274], [158, 285], [142, 292]];
            this.p7 = [[145, 132], [159, 142], [141, 149], [158, 160], [142, 167]];
            this.p8 = [[291, 90], [310, 92], [297, 106], [278, 104], [315, 108]];
        }
        return Constants;
    }());
    exports.Constants = Constants;
});



define('lib/capitalize-first',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CapitalizeFirstValueConverter = (function () {
        function CapitalizeFirstValueConverter() {
        }
        CapitalizeFirstValueConverter.prototype.toView = function (value) {
            if (value && typeof (value) === 'string') {
                return value.slice(0, 1).toUpperCase() + value.slice(1);
            }
            return '';
        };
        return CapitalizeFirstValueConverter;
    }());
    exports.CapitalizeFirstValueConverter = CapitalizeFirstValueConverter;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('lib/api-service',["require", "exports", "./../shared/ClientMessage", "aurelia-framework", "aurelia-event-aggregator", "./websocket", "../messages", "../environment", "./util", "aurelia-http-client", "../shared/reset-result", "../shared/protobuf-config"], function (require, exports, ClientMessage_1, aurelia_framework_1, aurelia_event_aggregator_1, websocket_1, messages_1, environment_1, util_1, aurelia_http_client_1, reset_result_1, protobuf_config_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ApiService = (function () {
        function ApiService(ea, util) {
            this.ea = ea;
            this.util = util;
            this.audioFiles = {
                bet: 'sounds/bet.wav',
                fold: 'sounds/fold.wav',
                deal: 'sounds/cardPlace1.wav',
                check: 'sounds/check.wav',
                message: 'sounds/message.wav',
                betShortcut: 'sounds/chipLay1.wav',
                yourturn: 'sounds/yourturn.',
                win: 'sounds/win.',
            };
            var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
            var port = environment_1.default.debug ? ':8111' : '';
            var host = window.location.hostname;
            this.wsURI = protocol + "://" + host + port + "/ws";
            this.sid = localStorage.getItem("sid");
            protobuf_config_1.default.init();
        }
        ApiService.prototype.waitForSocket = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var attempts = 0;
                if (_this.isSocketOpen())
                    resolve();
                var timeout = setInterval(function () {
                    if (_this.isSocketOpen()) {
                        clearInterval(timeout);
                        resolve();
                    }
                    else {
                        attempts++;
                    }
                    if (attempts > 100)
                        reject('socket did not open');
                }, 50);
            });
        };
        ApiService.prototype.isSocketOpen = function () {
            return this.ws && this.ws.readyState === WebSocket.OPEN;
        };
        ApiService.prototype.openWebSocket = function (onopen) {
            var _this = this;
            if (this.isSocketOpen()) {
                return;
            }
            this.ws = new websocket_1.default(this.getWsUri(), null, {
                strategy: "exponential",
                randomisationFactor: 0,
                initialDelay: 10,
                maxDelay: 300,
                factor: 3
            });
            this.ws.binaryType = "arraybuffer";
            this.ws.onmessage = function (event) { _this.socket_onmessage(event); };
            this.ws.onopen = onopen;
            this.ws.onerror = function (event) {
            };
            this.ws.onclose = function (event) {
                _this.ea.publish(new messages_1.ConnectionClosedEvent());
            };
        };
        ApiService.prototype.getWsUri = function () {
            var version = localStorage.getItem("app_version");
            var url = new URL(this.wsURI);
            if (this.sid) {
                url.searchParams.append('sid', this.sid);
            }
            if (version) {
                url.searchParams.append('version', version);
            }
            return url.toString();
        };
        ApiService.prototype.setAuth = function (sid) {
            this.authenticated = true;
            this.sid = sid;
            this.ws.url = this.getWsUri();
        };
        ApiService.prototype.removeAuth = function () {
            this.sid = undefined;
            this.authenticated = false;
        };
        ApiService.prototype.close = function () {
            this.util.setCurrentTableId(null);
            this.ws.close();
        };
        ApiService.prototype.socket_onmessage = function (event) {
            if (event.data.constructor.name === 'ArrayBuffer') {
                var message = protobuf_config_1.default.deserialize(event.data, 'DataContainer');
                if (message.pong == null)
                    console.log(new Date().toLocaleString() + " Received: (" + event.data.byteLength + " bytes)", message);
                this.ea.publish(new messages_1.DataMessageEvent(message));
            }
            else {
                console.error("event.data unexpected type!", event.data);
            }
        };
        ApiService.prototype.subscribeToTable = function (tableId) {
            var message = new ClientMessage_1.ClientMessage();
            message.subscribeToTableRequest = new ClientMessage_1.SubscribeToTableRequest();
            message.subscribeToTableRequest.tableId = tableId;
            this.sendMessage(message);
        };
        ApiService.prototype.sendMessage = function (message) {
            if (this.ws) {
                var buffer = protobuf_config_1.default.serialize(message, 'ClientMessage');
                this.ws.send(buffer);
                console.log(new Date().toLocaleString() + " Sent: (" + buffer.byteLength + " bytes)", message);
            }
            else {
                console.warn('cannot send message as ws is null', message);
            }
        };
        ApiService.prototype.send = function (data) {
            var message = new ClientMessage_1.ClientMessage();
            message[data.getFieldName()] = data;
            this.sendMessage(message);
        };
        ApiService.prototype.loadSounds = function () {
            if (this.loadedSounds)
                return;
            var soundFiles = [this.audioFiles.bet, this.audioFiles.fold, this.audioFiles.deal, this.audioFiles.check, this.audioFiles.message, this.audioFiles.betShortcut];
            var extension = this.audioSupport();
            if (extension) {
                this.audioFiles.yourturn += extension;
                this.audioFiles.win += extension;
                soundFiles.push(this.audioFiles.yourturn, this.audioFiles.win);
            }
            for (var i = 0; i < soundFiles.length; i++) {
                var audio = new Audio();
                audio.src = this.version.cdn + '/' + soundFiles[i];
                this.util.audio.push(audio);
            }
            this.loadedSounds = true;
        };
        ApiService.prototype.audioSupport = function () {
            var a = document.createElement('audio');
            var ogg = !!(a.canPlayType && a.canPlayType('audio/ogg;"').replace(/no/, ''));
            if (ogg)
                return 'ogg';
            var mp3 = !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
            if (mp3)
                return 'mp3';
            else
                return 0;
        };
        ApiService.prototype.getHttpClient = function () {
            var client = new aurelia_http_client_1.HttpClient();
            client.configure(function (x) {
                if (environment_1.default.debug) {
                    x.withBaseUrl("http://" + window.location.hostname + ":8111");
                }
            });
            return client;
        };
        ApiService.prototype.countryCheck = function () {
            var _this = this;
            return new Promise(function (resolve) {
                _this.getHttpClient().get('/api/countryCheck' + window.location.search)
                    .then(function (data) {
                    resolve(data.content);
                });
            });
        };
        ApiService.prototype.activate = function (request) {
            var _this = this;
            return new Promise(function (resolve) {
                _this.getHttpClient().post('/api/activate', request)
                    .then(function (data) {
                    resolve(data.content);
                });
            });
        };
        ApiService.prototype.reset = function (request) {
            var _this = this;
            return new Promise(function (resolve) {
                var result;
                _this.getHttpClient().get('api/reset/', request)
                    .then(function (data) {
                    Object.setPrototypeOf(data.content, reset_result_1.ResetResult.prototype);
                    result = data.content;
                })
                    .catch(function (reason) {
                    result = new reset_result_1.ResetResult();
                    _this.handleApiError(reason, result.errors);
                })
                    .then(function () {
                    resolve(result);
                });
            });
        };
        ApiService.prototype.resetPassword = function (request) {
            var _this = this;
            return new Promise(function (resolve) {
                var result;
                _this.getHttpClient().post('api/reset/', request)
                    .then(function (data) {
                    Object.setPrototypeOf(data.content, reset_result_1.ResetResult.prototype);
                    result = data.content;
                })
                    .catch(function (reason) {
                    result = new reset_result_1.ResetResult();
                    _this.handleApiError(reason, result.errors);
                })
                    .then(function () {
                    resolve(result);
                });
            });
        };
        ApiService.prototype.handleApiError = function (reason, errors) {
            if (reason instanceof aurelia_http_client_1.HttpResponseMessage) {
                if (reason.statusCode == 403 && reason.response.indexOf('CSRF') > -1) {
                    location.reload();
                }
                else {
                    errors.push(reason.statusText + ": " + reason.response);
                }
            }
            else {
                errors.push(reason);
            }
        };
        ApiService = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, util_1.Util])
        ], ApiService);
        return ApiService;
    }());
    exports.ApiService = ApiService;
});



define('lib/TournamentFilterValueConverter',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TournamentFilterValueConverter = (function () {
        function TournamentFilterValueConverter() {
        }
        TournamentFilterValueConverter.prototype.toView = function (array, tournamentId) {
            var _this = this;
            if (tournamentId) {
                return array.filter(function (t) { return t.tournamentId == tournamentId; }).sort(function (t1, t2) { return _this.getTableIndex(t1) - _this.getTableIndex(t2); });
            }
            else {
                return array.filter(function (t) { return !t.tournamentId; });
            }
        };
        TournamentFilterValueConverter.prototype.getTableIndex = function (table) {
            return parseInt(table.name.replace('Table', '').trim());
        };
        return TournamentFilterValueConverter;
    }());
    exports.TournamentFilterValueConverter = TournamentFilterValueConverter;
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('leaderboard',["require", "exports", "aurelia-framework", "aurelia-event-aggregator", "./lib/util", "./lib/api-service", "./shared/DataContainer", "./shared/CommonHelpers"], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, util_1, api_service_1, DataContainer_1, CommonHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Leaderboard = (function () {
        function Leaderboard(ea, util, apiService) {
            var _this = this;
            this.ea = ea;
            this.util = util;
            this.apiService = apiService;
            this.subscriptions = [];
            this.results = [];
            this.rates = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.LeaderboardResult, function (msg) { _this.handleLeaderboardResult(msg); }));
            this.subscriptions.push(ea.subscribe(DataContainer_1.ExchangeRateResult, function (msg) { _this.handleExchangeRateResult(msg); }));
        }
        Leaderboard.prototype.handleExchangeRateResult = function (data) {
            var _this = this;
            var _loop_1 = function (result) {
                var view = {
                    currency: result.base,
                    changed: false,
                };
                if (result.price) {
                    var numDecimalPlaces = result.price >= 1 ? 2 : 3;
                    view.price = '$' + CommonHelpers_1.numberWithCommas(result.price.toFixed(numDecimalPlaces));
                    view.percentChange = parseFloat((result.change / result.price * 100).toFixed(2));
                    view.volume = CommonHelpers_1.numberWithCommas(Math.round(result.volume));
                }
                var existingView = this_1.rates.find(function (r) { return r.currency === view.currency; });
                if (existingView) {
                    existingView.percentChange = view.percentChange;
                    existingView.price = view.price;
                    existingView.changed = true;
                }
                else {
                    this_1.rates.push(view);
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = data.rates || []; _i < _a.length; _i++) {
                var result = _a[_i];
                _loop_1(result);
            }
            setTimeout(function () {
                for (var _i = 0, _a = _this.rates; _i < _a.length; _i++) {
                    var u = _a[_i];
                    u.changed = false;
                }
            }, 2000);
        };
        Leaderboard.prototype.handleLeaderboardResult = function (data) {
            var _this = this;
            var _loop_2 = function (result) {
                var existingUser = this_2.results.find(function (r) { return r.screenName === result.screenName && r.currency === result.currency; });
                if (existingUser) {
                    existingUser.movement = result.profitLoss - existingUser.profitLoss;
                    existingUser.profitLoss = result.profitLoss;
                    existingUser.handsPlayed = result.handsPlayed;
                    existingUser.changed = true;
                }
                else {
                    this_2.results.push(result);
                }
            };
            var this_2 = this;
            for (var _i = 0, _a = data.users; _i < _a.length; _i++) {
                var result = _a[_i];
                _loop_2(result);
            }
            this.results.sort(function (p1, p2) { return p2.profitLoss - p1.profitLoss; });
            setTimeout(function () {
                for (var _i = 0, _a = _this.results; _i < _a.length; _i++) {
                    var u = _a[_i];
                    u.changed = false;
                }
            }, 2000);
        };
        Leaderboard.prototype.attached = function () {
        };
        Leaderboard.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        Leaderboard = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, util_1.Util, api_service_1.ApiService])
        ], Leaderboard);
        return Leaderboard;
    }());
    exports.Leaderboard = Leaderboard;
});



define('text!leaderboard.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./lib/number-format\"></require>\n  <require from=\"./lib/crypto-format\"></require>\n  <div id=\"leaderboard-container\">\n\n\n    \n      <div show.bind=\"rates.length\">\n          \n          <div style=\"margin-top: 10px;\">\n            <table class=\"leaderboard\">\n              <thead>\n                <tr>\n                  <th>Currency</th>          \n                  <th>Rate</th>          \n                  <th>Change (24 hr)</th>\n                  <th>Volume (24 hr)</th> \n                </tr>\n              </thead>\n              <tbody>\n                <tr repeat.for=\"rate of rates\">\n                    <td><span class=\"table-currency\">${rate.currency}</span> <i class=\"currency-icon currency-${rate.currency}\"></i></td>              \n                  <td>${rate.price}</td>\n                  <td>\n                    <span show.bind=\"rate.percentChange\" class=\"${rate.percentChange >= 0 ? 'leaderboard-profit-positive':'leaderboard-profit-negative'} ${rate.changed ? 'flash': ''}\">\n                      ${rate.percentChange.toFixed(2)}<span show.bind=\"rate.percentChange!=null\">%</span>\n                      <i class=\"fa fa-arrow-down leaderboard-profit-negative\" show.bind=\"rate.percentChange < 0\" ></i>\n                      <i class=\"fa fa-arrow-up leaderboard-profit-positive\" show.bind=\"rate.percentChange > 0\"></i>\n                    </span> \n                    <span show.bind=\"!rate.percentChange\">-</span>\n                  </td>                                    \n                    <td><span show.bind=\"rate.volume!=0\"> ${rate.volume} </span> <span show.bind=\"rate.volume==0\">-</span>  </td>                      \n                </tr>\n              </tbody>\n            </table>\n          </div>\n      </div>\n  \n      <div show.bind=\"results.length\">\n          <h4 style=\"margin-top: 20px;\">Leaderboard</h4>\n          <div style=\"margin-top: 10px;\">\n            <table class=\"table table-striped table-bordered table-hover table-condensed leaderboard\">\n              <thead>\n                <tr>\n                  <th>User</th>          \n                  <th>Currency</th>          \n                  <th>Profit/Loss</th>\n                  <th>Hands Played</th>\n                </tr>\n              </thead>\n              <tbody>\n                <tr repeat.for=\"result of results\">\n                  <td>${result.screenName}</td>\n                  <td><span class=\"table-currency\">${result.currency}</span> <i class=\"currency-icon currency-${result.currency}\"></i></td>\n                  <td class=\"${result.profitLoss > 0 ? 'leaderboard-profit-positive':'leaderboard-profit-negative'} ${result.changed ? 'flash': ''}\">\n                    <span>${result.profitLoss | cryptoFormat:result.currency}</span>\n                    <i class=\"fa fa-arrow-down leaderboard-profit-negative\" show.bind=\"result.movement < 0\" ></i>\n                    <i class=\"fa fa-arrow-up leaderboard-profit-positive\" show.bind=\"result.movement > 0\"></i>\n                  </td>\n                  <td class=\"${result.changed ? 'flash': ''}\" >${result.handsPlayed}</td>    \n    \n                </tr>\n              </tbody>\n            </table>\n          </div>\n      </div>\n\n      \n  </div>\n  \n\n</template>\n"; });
define('text!info.html', ['module'], function(module) { module.exports = "<template>\n    <div class=\"list-group centerBlock\">\n      <div href=\"#\" class=\"list-group-item\">\n        <h4 class=\"list-group-item-heading\">Immediate Fund Withdrawl</h4>\n        <p class=\"list-group-item-text\">Instantly transfer funds whens you stand up</p>\n      </div>\n      <div href=\"#\" class=\"list-group-item\">\n        <h4 class=\"list-group-item-heading\">No account required</h4>\n        <p class=\"list-group-item-text\">No sign up process. Play anonymously</p>\n      </div>\n      <div href=\"#\" class=\"list-group-item\">\n        <h4 class=\"list-group-item-heading\">Supported currencies</h4>\n        <p class=\"list-group-item-text\">DASH, BTC, Ethereum </p>\n      </div>\n      <div href=\"#\" class=\"list-group-item\">\n        <h4 class=\"list-group-item-heading\">Create private tables</h4>\n        <p class=\"list-group-item-text\">**coming soon</p>\n      </div>\n      <div href=\"#\" class=\"list-group-item\">\n        <h4 class=\"list-group-item-heading\">Free tables</h4>\n        <p class=\"list-group-item-text\">Practice against other players</p>\n      </div>\n    </div>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('global-chat',["require", "exports", "aurelia-framework", "aurelia-event-aggregator", "./lib/util", "./lib/api-service", "./shared/DataContainer", "./messages", "./shared/ClientMessage"], function (require, exports, aurelia_framework_1, aurelia_event_aggregator_1, util_1, api_service_1, DataContainer_1, messages_1, ClientMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var GlobalChat = (function () {
        function GlobalChat(ea, apiService, util) {
            var _this = this;
            this.ea = ea;
            this.apiService = apiService;
            this.util = util;
            this.globalChatMessages = [];
            this.subscriptions = [];
            this.showChat = true;
            this.showUsers = true;
            this.users = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.GlobalChatResult, function (result) { _this.handleChat(result); }));
            this.subscriptions.push(ea.subscribe(DataContainer_1.GlobalUsers, function (result) { _this.handleGlobalUsers(result); }));
            this.subscriptions.push(ea.subscribe(messages_1.ConnectionClosedEvent, function (msg) {
                _this.users = [];
            }));
        }
        GlobalChat.prototype.toggleOnline = function () {
            this.showUsers = !this.showUsers;
        };
        GlobalChat.prototype.handleGlobalUsers = function (data) {
            var _loop_1 = function (user) {
                existing = this_1.users.find(function (u) { return u.screenName === user.screenName; });
                if (existing && !user.online)
                    this_1.users.splice(this_1.users.indexOf(existing), 1);
                if (!existing && user.online) {
                    var view = Object.assign({}, user);
                    view.showYouLabel = !this_1.util.user.activated && user.screenName == this_1.util.user.screenName;
                    this_1.users.push(view);
                    if (!data.initialData && this_1.util.user.notifyUserStatus && user.screenName !== this_1.util.user.screenName) {
                        this_1.util.notify(user.screenName + " is online");
                    }
                }
            };
            var this_1 = this, existing;
            for (var _i = 0, _a = data.users; _i < _a.length; _i++) {
                var user = _a[_i];
                _loop_1(user);
            }
            this.users.sort(function (p1, p2) { return p1.screenName.localeCompare(p2.screenName); });
        };
        GlobalChat.prototype.globalChatKeyPress = function (event) {
            if (event.keyCode === 13) {
                if (this.globalChatInput) {
                    this.apiService.send(new ClientMessage_1.GlobalChatRequest(this.globalChatInput));
                    this.globalChatInput = '';
                    this.apiService.loadSounds();
                }
            }
        };
        GlobalChat.prototype.handleChat = function (result) {
            var _this = this;
            if (result.initialData) {
                this.globalChatMessages = result.messages;
                setTimeout(function () {
                    _this.globalChatboxElemScrollHeight = _this.globalChatboxElem.scrollHeight;
                    _this.usersOnlineTop = _this.globalChatboxElemScrollHeight - 200;
                }, 350);
            }
            else {
                for (var _i = 0, _a = result.messages; _i < _a.length; _i++) {
                    var message = _a[_i];
                    this.globalChatMessages.push(message);
                }
                this.globalChatboxElemScrollHeight = this.globalChatboxElem.scrollHeight;
                if (!result.initialData && this.showChat)
                    this.util.playSound(this.apiService.audioFiles.message);
                this.usersOnlineTop = this.globalChatboxElemScrollHeight - 200;
            }
        };
        GlobalChat.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        GlobalChat.prototype.attached = function () {
        };
        GlobalChat = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService, util_1.Util])
        ], GlobalChat);
        return GlobalChat;
    }());
    exports.GlobalChat = GlobalChat;
});



define('text!global-chat.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./lib/number-format\"></require>\n\n  <div style=\"border: 1px solid gray; margin-top: 10px; padding: 2px;\">\n    <div class=\"global-chatbox-header\" style=\"background-color:lightgray\">\n      <span class=\"global-chat-header-icon\"><span style=\"margin-left:10px\">Troll Box</span></span>\n      <button class=\"btn btn-primary btn-xs\" click.delegate=\"showChat=!showChat\" style=\"float: right;\">${showChat ? 'Hide':'Show'}</button>\n      <!-- <button class=\"btn btn-primary btn-xs\" click.delegate=\"toggleOnline()\" style=\"float: right;\">Online Now</button> -->\n    </div>\n    \n    \n    <div id=\"global-chatbox-container\" show.bind=\"showChat\">\n      <div id=\"global-chatbox\" ref=\"globalChatboxElem\" scrolltop.bind=\"globalChatboxElemScrollHeight\" >\n        <p repeat.for=\"chat of globalChatMessages\" class=\"chatRow\">\n          <span class=\"chatScreenName\">${chat.screenName}:</span>\n          <span class=\"global-chatMessage\">${chat.message}</span>\n        </p>                 \n      </div>\n      <div id=\"global-online\" show.bind=\"showUsers\">\n        <div repeat.for=\"user of users\">\n          \n          <span class=\"f16\" show.bind=\"user.countryCode\"><span class=\"flag ${user.countryCode}\" title.bind=\"user.country\"> </span></span>    \n          <i class=\"fa fa-user-circle\" show.bind=\"!user.countryCode\"></i> \n\n          <span>${user.screenName}<span show.bind=\"user.showYouLabel\"> (You)</span> </span>   \n          \n          \n        </div>\n      </div>\n      <div class=\"clear\"></div>\n    </div>\n    \n    <div show.bind=\"showChat\" >\n      <input type=\"text\" placeholder=\"enter chat message\" class=\"form-control input-sm\" keyup.delegate=\"globalChatKeyPress($event)\" value.bind=\"globalChatInput\"/>\n    </div>\n\n  </div>\n\n  <div>\n      \n  </div>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define('funding-window',["require", "exports", "aurelia-framework"], function (require, exports, aurelia_framework_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var FundingWindow = (function () {
        function FundingWindow() {
        }
        FundingWindow.prototype.activate = function (model) {
            this.model = model;
        };
        FundingWindow = __decorate([
            aurelia_framework_1.autoinject()
        ], FundingWindow);
        return FundingWindow;
    }());
    exports.FundingWindow = FundingWindow;
    var FundingWindowModel = (function () {
        function FundingWindowModel() {
        }
        return FundingWindowModel;
    }());
    exports.FundingWindowModel = FundingWindowModel;
});



define('text!funding-window.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./deposit-form\"></require>\n\n  <ux-dialog>\n    \n    <ux-dialog-body>\n\n      <deposit-form funding-window-model.bind=\"model\"></deposit-form>\n      \n    </ux-dialog-body>\n\n  </ux-dialog>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('forgot-password-form',["require", "exports", "./lib/api-service", "./shared/forgot-request", "aurelia-framework", "./shared/ClientMessage", "aurelia-event-aggregator"], function (require, exports, api_service_1, forgot_request_1, aurelia_framework_1, ClientMessage_1, aurelia_event_aggregator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ForgotPasswordForm = (function () {
        function ForgotPasswordForm(apiService, ea) {
            var _this = this;
            this.apiService = apiService;
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(forgot_request_1.ForgotResult, function (r) { return _this.handleResult(r); }));
        }
        ForgotPasswordForm.prototype.submit = function () {
            this.submitting = true;
            var request = new forgot_request_1.ForgotRequest();
            request.email = this.email;
            var message = new ClientMessage_1.ClientMessage();
            message.forgotRequest = request;
            this.apiService.sendMessage(message);
        };
        ForgotPasswordForm.prototype.handleResult = function (result) {
            this.result = result;
            this.submitting = false;
        };
        ForgotPasswordForm.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        ForgotPasswordForm = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService, aurelia_event_aggregator_1.EventAggregator])
        ], ForgotPasswordForm);
        return ForgotPasswordForm;
    }());
    exports.ForgotPasswordForm = ForgotPasswordForm;
});



define('text!forgot-password-form.html', ['module'], function(module) { module.exports = "<template>\n  <form submit.delegate=\"submit()\">\n    <legend>Forgot Password</legend>\n    <div class=\"form-group\">\n      <p>Enter your email address and we'll send you reset instructions.</p>\n      <label for=\"email\" class=\"sr-only\">Enter Your Email:</label>\n      <input type=\"email\" name=\"email\" placeholder=\"Your Email\" autocomplete=\"off\" autofocus=\"\" required=\"\" class=\"form-control\" value.bind=\"email\">\n      <div id=\"hint\"></div>\n    </div>\n    <div class=\"form-group\">\n      <button type=\"submit\" class=\"btn btn-primary\" disabled.bind=\"submitting || result.success\"><i class=\"fa ${submitting ? 'fa-spinner fa-spin': 'fa-lock'}\"></i></i>&nbsp;Reset Password</button>&nbsp;\n    </div>\n\n    <div class=\"form-group\">\n        <div class=\"alert alert-danger\" show.bind=\"!submitting && result && !result.success\">\n            <ul>\n              <li repeat.for=\"error of result.errors\">\n                  <span>${error}</span>\n              </li>\n            </ul>\n        </div>\n        <div class=\"alert alert-success\" show.bind=\"result.success\">\n          <p>${result.message}</p>                \n      </div>\n      </div>\n\n  </form>\n</template>>\n"; });
define('text!flags16.css', ['module'], function(module) { module.exports = ".f16 .flag {\n  display: inline-block;\n  height: 16px;\n  width: 16px;\n  vertical-align: text-top;\n  line-height: 16px;\n  background: url(\"images/flags16.png\") no-repeat; }\n\n.f16 ._African_Union {\n  background-position: 0 -16px; }\n\n.f16 ._Arab_League {\n  background-position: 0 -32px; }\n\n.f16 ._ASEAN {\n  background-position: 0 -48px; }\n\n.f16 ._CARICOM {\n  background-position: 0 -64px; }\n\n.f16 ._CIS {\n  background-position: 0 -80px; }\n\n.f16 ._Commonwealth {\n  background-position: 0 -96px; }\n\n.f16 ._England {\n  background-position: 0 -112px; }\n\n.f16 ._European_Union {\n  background-position: 0 -128px; }\n\n.f16 ._Islamic_Conference {\n  background-position: 0 -144px; }\n\n.f16 ._Kosovo {\n  background-position: 0 -160px; }\n\n.f16 ._NATO {\n  background-position: 0 -176px; }\n\n.f16 ._Northern_Cyprus {\n  background-position: 0 -192px; }\n\n.f16 ._Northern_Ireland {\n  background-position: 0 -208px; }\n\n.f16 ._Olimpic_Movement {\n  background-position: 0 -224px; }\n\n.f16 ._OPEC {\n  background-position: 0 -240px; }\n\n.f16 ._Red_Cross {\n  background-position: 0 -256px; }\n\n.f16 ._Scotland {\n  background-position: 0 -272px; }\n\n.f16 ._Somaliland {\n  background-position: 0 -288px; }\n\n.f16 ._Tibet {\n  background-position: 0 -304px; }\n\n.f16 ._United_Nations {\n  background-position: 0 -320px; }\n\n.f16 ._Wales {\n  background-position: 0 -336px; }\n\n.f16 .eu {\n  background-position: 0 -128px; }\n\n.f16 .ad {\n  background-position: 0 -352px; }\n\n.f16 .ae {\n  background-position: 0 -368px; }\n\n.f16 .af {\n  background-position: 0 -384px; }\n\n.f16 .ag {\n  background-position: 0 -400px; }\n\n.f16 .ai {\n  background-position: 0 -416px; }\n\n.f16 .al {\n  background-position: 0 -432px; }\n\n.f16 .am {\n  background-position: 0 -448px; }\n\n.f16 .ao {\n  background-position: 0 -464px; }\n\n.f16 .aq {\n  background-position: 0 -480px; }\n\n.f16 .ar {\n  background-position: 0 -496px; }\n\n.f16 .as {\n  background-position: 0 -512px; }\n\n.f16 .at {\n  background-position: 0 -528px; }\n\n.f16 .au {\n  background-position: 0 -544px; }\n\n.f16 .aw {\n  background-position: 0 -560px; }\n\n.f16 .ax {\n  background-position: 0 -576px; }\n\n.f16 .az {\n  background-position: 0 -592px; }\n\n.f16 .ba {\n  background-position: 0 -608px; }\n\n.f16 .bb {\n  background-position: 0 -624px; }\n\n.f16 .bd {\n  background-position: 0 -640px; }\n\n.f16 .be {\n  background-position: 0 -656px; }\n\n.f16 .bf {\n  background-position: 0 -672px; }\n\n.f16 .bg {\n  background-position: 0 -688px; }\n\n.f16 .bh {\n  background-position: 0 -704px; }\n\n.f16 .bi {\n  background-position: 0 -720px; }\n\n.f16 .bj {\n  background-position: 0 -736px; }\n\n.f16 .bm {\n  background-position: 0 -752px; }\n\n.f16 .bn {\n  background-position: 0 -768px; }\n\n.f16 .bo {\n  background-position: 0 -784px; }\n\n.f16 .br {\n  background-position: 0 -800px; }\n\n.f16 .bs {\n  background-position: 0 -816px; }\n\n.f16 .bt {\n  background-position: 0 -832px; }\n\n.f16 .bw {\n  background-position: 0 -848px; }\n\n.f16 .by {\n  background-position: 0 -864px; }\n\n.f16 .bz {\n  background-position: 0 -880px; }\n\n.f16 .ca {\n  background-position: 0 -896px; }\n\n.f16 .cg {\n  background-position: 0 -912px; }\n\n.f16 .cf {\n  background-position: 0 -928px; }\n\n.f16 .cd {\n  background-position: 0 -944px; }\n\n.f16 .ch {\n  background-position: 0 -960px; }\n\n.f16 .ci {\n  background-position: 0 -976px; }\n\n.f16 .ck {\n  background-position: 0 -992px; }\n\n.f16 .cl {\n  background-position: 0 -1008px; }\n\n.f16 .cm {\n  background-position: 0 -1024px; }\n\n.f16 .cn {\n  background-position: 0 -1040px; }\n\n.f16 .co {\n  background-position: 0 -1056px; }\n\n.f16 .cr {\n  background-position: 0 -1072px; }\n\n.f16 .cu {\n  background-position: 0 -1088px; }\n\n.f16 .cv {\n  background-position: 0 -1104px; }\n\n.f16 .cy {\n  background-position: 0 -1120px; }\n\n.f16 .cz {\n  background-position: 0 -1136px; }\n\n.f16 .de {\n  background-position: 0 -1152px; }\n\n.f16 .dj {\n  background-position: 0 -1168px; }\n\n.f16 .dk {\n  background-position: 0 -1184px; }\n\n.f16 .dm {\n  background-position: 0 -1200px; }\n\n.f16 .do {\n  background-position: 0 -1216px; }\n\n.f16 .dz {\n  background-position: 0 -1232px; }\n\n.f16 .ec {\n  background-position: 0 -1248px; }\n\n.f16 .ee {\n  background-position: 0 -1264px; }\n\n.f16 .eg {\n  background-position: 0 -1280px; }\n\n.f16 .eh {\n  background-position: 0 -1296px; }\n\n.f16 .er {\n  background-position: 0 -1312px; }\n\n.f16 .es {\n  background-position: 0 -1328px; }\n\n.f16 .et {\n  background-position: 0 -1344px; }\n\n.f16 .fi {\n  background-position: 0 -1360px; }\n\n.f16 .fj {\n  background-position: 0 -1376px; }\n\n.f16 .fm {\n  background-position: 0 -1392px; }\n\n.f16 .fo {\n  background-position: 0 -1408px; }\n\n.f16 .fr {\n  background-position: 0 -1424px; }\n\n.f16 .bl {\n  background-position: 0 -1424px; }\n\n.f16 .cp {\n  background-position: 0 -1424px; }\n\n.f16 .mf {\n  background-position: 0 -1424px; }\n\n.f16 .yt {\n  background-position: 0 -1424px; }\n\n.f16 .ga {\n  background-position: 0 -1440px; }\n\n.f16 .gb {\n  background-position: 0 -1456px; }\n\n.f16 .sh {\n  background-position: 0 -1456px; }\n\n.f16 .gd {\n  background-position: 0 -1472px; }\n\n.f16 .ge {\n  background-position: 0 -1488px; }\n\n.f16 .gg {\n  background-position: 0 -1504px; }\n\n.f16 .gh {\n  background-position: 0 -1520px; }\n\n.f16 .gi {\n  background-position: 0 -1536px; }\n\n.f16 .gl {\n  background-position: 0 -1552px; }\n\n.f16 .gm {\n  background-position: 0 -1568px; }\n\n.f16 .gn {\n  background-position: 0 -1584px; }\n\n.f16 .gp {\n  background-position: 0 -1600px; }\n\n.f16 .gq {\n  background-position: 0 -1616px; }\n\n.f16 .gr {\n  background-position: 0 -1632px; }\n\n.f16 .gt {\n  background-position: 0 -1648px; }\n\n.f16 .gu {\n  background-position: 0 -1664px; }\n\n.f16 .gw {\n  background-position: 0 -1680px; }\n\n.f16 .gy {\n  background-position: 0 -1696px; }\n\n.f16 .hk {\n  background-position: 0 -1712px; }\n\n.f16 .hn {\n  background-position: 0 -1728px; }\n\n.f16 .hr {\n  background-position: 0 -1744px; }\n\n.f16 .ht {\n  background-position: 0 -1760px; }\n\n.f16 .hu {\n  background-position: 0 -1776px; }\n\n.f16 .id {\n  background-position: 0 -1792px; }\n\n.f16 .mc {\n  background-position: 0 -1792px; }\n\n.f16 .ie {\n  background-position: 0 -1808px; }\n\n.f16 .il {\n  background-position: 0 -1824px; }\n\n.f16 .im {\n  background-position: 0 -1840px; }\n\n.f16 .in {\n  background-position: 0 -1856px; }\n\n.f16 .iq {\n  background-position: 0 -1872px; }\n\n.f16 .ir {\n  background-position: 0 -1888px; }\n\n.f16 .is {\n  background-position: 0 -1904px; }\n\n.f16 .it {\n  background-position: 0 -1920px; }\n\n.f16 .je {\n  background-position: 0 -1936px; }\n\n.f16 .jm {\n  background-position: 0 -1952px; }\n\n.f16 .jo {\n  background-position: 0 -1968px; }\n\n.f16 .jp {\n  background-position: 0 -1984px; }\n\n.f16 .ke {\n  background-position: 0 -2000px; }\n\n.f16 .kg {\n  background-position: 0 -2016px; }\n\n.f16 .kh {\n  background-position: 0 -2032px; }\n\n.f16 .ki {\n  background-position: 0 -2048px; }\n\n.f16 .km {\n  background-position: 0 -2064px; }\n\n.f16 .kn {\n  background-position: 0 -2080px; }\n\n.f16 .kp {\n  background-position: 0 -2096px; }\n\n.f16 .kr {\n  background-position: 0 -2112px; }\n\n.f16 .kw {\n  background-position: 0 -2128px; }\n\n.f16 .ky {\n  background-position: 0 -2144px; }\n\n.f16 .kz {\n  background-position: 0 -2160px; }\n\n.f16 .la {\n  background-position: 0 -2176px; }\n\n.f16 .lb {\n  background-position: 0 -2192px; }\n\n.f16 .lc {\n  background-position: 0 -2208px; }\n\n.f16 .li {\n  background-position: 0 -2224px; }\n\n.f16 .lk {\n  background-position: 0 -2240px; }\n\n.f16 .lr {\n  background-position: 0 -2256px; }\n\n.f16 .ls {\n  background-position: 0 -2272px; }\n\n.f16 .lt {\n  background-position: 0 -2288px; }\n\n.f16 .lu {\n  background-position: 0 -2304px; }\n\n.f16 .lv {\n  background-position: 0 -2320px; }\n\n.f16 .ly {\n  background-position: 0 -2336px; }\n\n.f16 .ma {\n  background-position: 0 -2352px; }\n\n.f16 .md {\n  background-position: 0 -2368px; }\n\n.f16 .me {\n  background-position: 0 -2384px; }\n\n.f16 .mg {\n  background-position: 0 -2400px; }\n\n.f16 .mh {\n  background-position: 0 -2416px; }\n\n.f16 .mk {\n  background-position: 0 -2432px; }\n\n.f16 .ml {\n  background-position: 0 -2448px; }\n\n.f16 .mm {\n  background-position: 0 -2464px; }\n\n.f16 .mn {\n  background-position: 0 -2480px; }\n\n.f16 .mo {\n  background-position: 0 -2496px; }\n\n.f16 .mq {\n  background-position: 0 -2512px; }\n\n.f16 .mr {\n  background-position: 0 -2528px; }\n\n.f16 .ms {\n  background-position: 0 -2544px; }\n\n.f16 .mt {\n  background-position: 0 -2560px; }\n\n.f16 .mu {\n  background-position: 0 -2576px; }\n\n.f16 .mv {\n  background-position: 0 -2592px; }\n\n.f16 .mw {\n  background-position: 0 -2608px; }\n\n.f16 .mx {\n  background-position: 0 -2624px; }\n\n.f16 .my {\n  background-position: 0 -2640px; }\n\n.f16 .mz {\n  background-position: 0 -2656px; }\n\n.f16 .na {\n  background-position: 0 -2672px; }\n\n.f16 .nc {\n  background-position: 0 -2688px; }\n\n.f16 .ne {\n  background-position: 0 -2704px; }\n\n.f16 .ng {\n  background-position: 0 -2720px; }\n\n.f16 .ni {\n  background-position: 0 -2736px; }\n\n.f16 .nl {\n  background-position: 0 -2752px; }\n\n.f16 .bq {\n  background-position: 0 -2752px; }\n\n.f16 .no {\n  background-position: 0 -2768px; }\n\n.f16 .bv {\n  background-position: 0 -2768px; }\n\n.f16 .nq {\n  background-position: 0 -2768px; }\n\n.f16 .sj {\n  background-position: 0 -2768px; }\n\n.f16 .np {\n  background-position: 0 -2784px; }\n\n.f16 .nr {\n  background-position: 0 -2800px; }\n\n.f16 .nz {\n  background-position: 0 -2816px; }\n\n.f16 .om {\n  background-position: 0 -2832px; }\n\n.f16 .pa {\n  background-position: 0 -2848px; }\n\n.f16 .pe {\n  background-position: 0 -2864px; }\n\n.f16 .pf {\n  background-position: 0 -2880px; }\n\n.f16 .pg {\n  background-position: 0 -2896px; }\n\n.f16 .ph {\n  background-position: 0 -2912px; }\n\n.f16 .pk {\n  background-position: 0 -2928px; }\n\n.f16 .pl {\n  background-position: 0 -2944px; }\n\n.f16 .pr {\n  background-position: 0 -2960px; }\n\n.f16 .ps {\n  background-position: 0 -2976px; }\n\n.f16 .pt {\n  background-position: 0 -2992px; }\n\n.f16 .pw {\n  background-position: 0 -3008px; }\n\n.f16 .py {\n  background-position: 0 -3024px; }\n\n.f16 .qa {\n  background-position: 0 -3040px; }\n\n.f16 .re {\n  background-position: 0 -3056px; }\n\n.f16 .ro {\n  background-position: 0 -3072px; }\n\n.f16 .rs {\n  background-position: 0 -3088px; }\n\n.f16 .ru {\n  background-position: 0 -3104px; }\n\n.f16 .rw {\n  background-position: 0 -3120px; }\n\n.f16 .sa {\n  background-position: 0 -3136px; }\n\n.f16 .sb {\n  background-position: 0 -3152px; }\n\n.f16 .sc {\n  background-position: 0 -3168px; }\n\n.f16 .sd {\n  background-position: 0 -3184px; }\n\n.f16 .se {\n  background-position: 0 -3200px; }\n\n.f16 .sg {\n  background-position: 0 -3216px; }\n\n.f16 .si {\n  background-position: 0 -3232px; }\n\n.f16 .sk {\n  background-position: 0 -3248px; }\n\n.f16 .sl {\n  background-position: 0 -3264px; }\n\n.f16 .sm {\n  background-position: 0 -3280px; }\n\n.f16 .sn {\n  background-position: 0 -3296px; }\n\n.f16 .so {\n  background-position: 0 -3312px; }\n\n.f16 .sr {\n  background-position: 0 -3328px; }\n\n.f16 .st {\n  background-position: 0 -3344px; }\n\n.f16 .sv {\n  background-position: 0 -3360px; }\n\n.f16 .sy {\n  background-position: 0 -3376px; }\n\n.f16 .sz {\n  background-position: 0 -3392px; }\n\n.f16 .tc {\n  background-position: 0 -3408px; }\n\n.f16 .td {\n  background-position: 0 -3424px; }\n\n.f16 .tg {\n  background-position: 0 -3440px; }\n\n.f16 .th {\n  background-position: 0 -3456px; }\n\n.f16 .tj {\n  background-position: 0 -3472px; }\n\n.f16 .tl {\n  background-position: 0 -3488px; }\n\n.f16 .tm {\n  background-position: 0 -3504px; }\n\n.f16 .tn {\n  background-position: 0 -3520px; }\n\n.f16 .to {\n  background-position: 0 -3536px; }\n\n.f16 .tr {\n  background-position: 0 -3552px; }\n\n.f16 .tt {\n  background-position: 0 -3568px; }\n\n.f16 .tv {\n  background-position: 0 -3584px; }\n\n.f16 .tw {\n  background-position: 0 -3600px; }\n\n.f16 .tz {\n  background-position: 0 -3616px; }\n\n.f16 .ua {\n  background-position: 0 -3632px; }\n\n.f16 .ug {\n  background-position: 0 -3648px; }\n\n.f16 .us {\n  background-position: 0 -3664px; }\n\n.f16 .uy {\n  background-position: 0 -3680px; }\n\n.f16 .uz {\n  background-position: 0 -3696px; }\n\n.f16 .va {\n  background-position: 0 -3712px; }\n\n.f16 .vc {\n  background-position: 0 -3728px; }\n\n.f16 .ve {\n  background-position: 0 -3744px; }\n\n.f16 .vg {\n  background-position: 0 -3760px; }\n\n.f16 .vi {\n  background-position: 0 -3776px; }\n\n.f16 .vn {\n  background-position: 0 -3792px; }\n\n.f16 .vu {\n  background-position: 0 -3808px; }\n\n.f16 .ws {\n  background-position: 0 -3824px; }\n\n.f16 .ye {\n  background-position: 0 -3840px; }\n\n.f16 .za {\n  background-position: 0 -3856px; }\n\n.f16 .zm {\n  background-position: 0 -3872px; }\n\n.f16 .zw {\n  background-position: 0 -3888px; }\n\n.f16 .sx {\n  background-position: 0 -3904px; }\n\n.f16 .cw {\n  background-position: 0 -3920px; }\n\n.f16 .ss {\n  background-position: 0 -3936px; }\n\n.f16 .nu {\n  background-position: 0 -3952px; }\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('faq',["require", "exports", "aurelia-framework", "./lib/api-service"], function (require, exports, aurelia_framework_1, api_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Faq = (function () {
        function Faq(apiService) {
            this.apiService = apiService;
        }
        Object.defineProperty(Faq.prototype, "appSupportEmail", {
            get: function () {
                return this.apiService.version == null ? '' : this.apiService.version.appSupportEmail;
            },
            enumerable: true,
            configurable: true
        });
        Faq.prototype.scrollToElement = function (elementId) {
            document.getElementById(elementId).scrollIntoView(true);
            window.scrollBy(0, -100);
        };
        Faq = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService])
        ], Faq);
        return Faq;
    }());
    exports.Faq = Faq;
});



define('text!faq.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"container\">\n    <div class=\"row\">\n      <h2>Frequently asked questions </h2>\n\n      <a route-href=\"route: home\" class=\"btn btn-primary btn-xs\" style=\"float: right\">Back to tables</a>\n\n      <br />\n      <br />\n      <br />\n      <div class=\"alert alert-warning alert-dismissible\" role=\"alert\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"alert\">\n          <span aria-hidden=\"true\">×</span>\n          <span class=\"sr-only\">Close</span>\n        </button>\n        If you cannot find an answer to your question, please make sure to <a href=\"mailto:${appSupportEmail}\"> contact us.</a>\n      </div>\n      <br />\n      <div class=\"faq-block\">\n        <ol>\n          \n          <li><a href=\"#\" click.delegate=\"scrollToElement('2')\">Do you take customers from any Country?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('3')\">What crypto currencies do you support?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('4')\">Can I play with fiat currency?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('5')\">What are the fees/rake?</a> <i>(1%)</i></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('6')\">How do I fund my account and start playing?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('7')\">How do I set up an account?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('8')\">I don’t have a Wallet yet. What is it and how do I get one?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('9')\">Where can I get cryptocurrency?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('10')\">If I have a problem, how do I get in contact?</a></li>\n          <li><a href=\"#\" click.delegate=\"scrollToElement('11')\">How do I cash out?</a></li>\n        </ol>\n\n        \n\n        <div>\n          <h3 id=\"2\">2) Do you take any customers?</h3>\n          <p>We support all regions except the US and Australia. Sorry if you’re in one of those two countries! </p>\n        </div>\n\n        <div>\n          <h3 id=\"3\">3) What crypto currencies do you support? </h3>\n          <p>The big 3; Bitcoin, Ethereum and Dash. We’re currently working on support for ERC-20 compliant tokens and hope\n            to have good news soon!\n          </p>\n        </div>\n\n        <div>\n          <h3 id=\"4\">4) Can I play with fiat currency?</h3>\n          <p>No, sorry. Cryptocurrencies only</p>\n        </div>\n\n        <div id=\"5\">\n          <h3 >5) What are the fees? </h3>\n          <p>Absolutely minimal and we’re transparent about it: 1%\n            <br> Most poker sites take 2.5 - 6% as the ‘rake’, and use complicated structures that make it near impossible to\n            compare the actual fees.\n            <br> We only take 1% rake. Clear and simple so you can enjoy playing.\n            <br>\n          </p>\n        </div>\n\n        <div>\n          <h3 id=\"6\">6) How do I fund my account and start playing? </h3>\n          <p>If you’ve already got a cryptocurrency wallet with currency, then follow the below steps. If you don’t already\n            have a functioning wallet, then please go to Question 7.\n          </p>\n          <ol>\n            <li>Choose a table based on your coin. </li>\n            <li>Click ‘Sit down’</li>\n            <li>An address should be generated. Copy this address.</li>\n            <li>Go to your Wallet and enter this address and the amount you would like to fund. Select ‘InstandSend’ if available.\n              Otherwise, it will take up to 2 ½ minutes for funds to arrive\n            </li>\n            <li>Once your funds arrive, choose your buy in amount, sit down and enjoy playing!\n            </li>\n          </ol>\n          <p>You don’t need an account to play at Troy’s House, but you can set one up to help when playing with friends\n          </p>\n        </div>\n\n        <div>\n          <h3 id=\"7\">7) How do I set up an account? </h3>\n          <p>You don’t need an account to play at Troy’s House, but you can set one up to help when playing with friends </p>\n          <ol>\n            <li>Click on ‘My Account’</li>\n            <li>User Id: If you would like to play across multiple devices, copy this address. Then re-enter on your other device(s)\n              so that you can be recognised on each device.\n            </li>\n            <li>Choose your Screen Name\n            </li>\n            <li>If you would like your gravatar to be displayed, enter your associated email address.\n            </li>\n            <li>Transfer funds: To share funds between players, just enter their screen name and the amount.\n            </li>\n          </ol>\n        </div>\n\n        <div>\n          <h3 id=\"8\">8) I don’t have a Wallet yet. What is it and how do I get one?</h3>\n          <p>A cryptocurrency wallet is a secure digital wallet used to store, send, and receive digital currency like Bitcoin.\n            Cryptocurrency itself is not actually “stored” in a wallet. Instead, a private key (secure digital code known\n            only to you and your wallet) is stored that shows ownership of a public key (a public digital code connected\n            to a certain amount of currency). So your wallet stores your private and public keys, allows you to send and\n            receive coins, and also acts as a personal ledger of transactions.\n          </p>\n\n          <p>\n            Most coins have an official wallet or a few officially recommended third party wallets. If you are new to cryptocurrency,\n            then we recommend getting started with those on dash.org. DashCore has InstantSend capability\n\n          </p>\n          <ol>\n            <li>DashCore</li>\n            <li>Exodus</li>\n            <li>Jaxx</li>\n          </ol>\n          <p>\n            Once you’re familiar with how wallets operate, you can explore a wide range of different wallets which offer varying pros\n            and cons.\n\n          </p>\n          <p>\n            <strong>IMPORTANT:</strong> Some software offered as a wallet is actually malware trying to take advantage of those willing to download and\n            install unofficial software off the internet. Never trust mining or wallet software that comes from a source\n            that you don’t know and trust. Start with well worn solutions like the ones that are officially endorsed..\n\n          </p>\n          <p>\n              <strong>IMPORTANT:</strong> Never share your wallet password or private key and never enter your password or private key anywhere (unless\n            you are accessing your wallet via private key and password). To send coins and receive coins you only need to\n            share your public wallet address (your “public key”).\n\n          </p>\n        </div>\n\n        <div>\n          <h3 id=\"9\">9) Where can I get cryptocurrency?</h3>\n          <p>We recommend 3 options: </p>\n          <ol>\n            <li>Uphold - Lots of currencies, lots of countries\n            </li>\n            <li>Bitpanda - Europe focused, Bitpanda (previously Coinimal) has been a reliable currency source for Dash, Ethereum\n              and Bitcoin for several years\n            </li>\n            <li>Coinspot.com.au - Supports Bitcoin, Litecoin & Dogecoin.</li>\n          </ol>\n        </div>\n\n        <div>\n          <h3 id=\"10\">10) If I have a problem, how do I get in contact?</h3>\n          <p><a href=\"mailto:${appSupportEmail}\">Click here</a> to message us. We usually turn contact requests around in 24 hours.\n          </p>\n        </div>\n\n        <div>\n          <h3 id=\"11\">11) How do I cash out?</h3>\n          <ol>\n            <li>Go to your Wallet and generate and copy a Receiving Address\n            </li>\n            <li>Click the ‘Cashier’ button on the top right hand side\n            </li>\n            <li>Paste the Receiving Address and click ‘Confirm & Withdraw’\n            </li>\n            <li>Wait for your confirmation and you’re done!\n            </li>\n          </ol>\n          <p>\n            'Cash Out' transfers are immediately pushed to the network. Unlike other sites which like to hold onto your money as long\n            as possible, we harness the power of cryptocurrencies to ensure you receive your money ASAP.\n\n          </p>\n        </div>\n\n      </div>\n    </div>\n  </div>\n\n</template>\n"; });
define('environment',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        debug: true,
        testing: true
    };
});



var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('duplicate-ip',["require", "exports", "aurelia-framework", "./lib/api-service"], function (require, exports, aurelia_framework_1, api_service_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DuplicateIp = (function () {
        function DuplicateIp(apiService) {
            this.apiService = apiService;
        }
        Object.defineProperty(DuplicateIp.prototype, "appSupportEmail", {
            get: function () {
                return this.apiService.version == null ? '' : this.apiService.version.appSupportEmail;
            },
            enumerable: true,
            configurable: true
        });
        DuplicateIp = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService])
        ], DuplicateIp);
        return DuplicateIp;
    }());
    exports.DuplicateIp = DuplicateIp;
});



define('text!duplicate-ip.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"container\">\n    <div class=\"row\" style=\"padding: 20px 0\">\n      \n      <h2 class=\"text-center\">You have been logged out </h2>\n      <p>You have been disconnected due to a connection from the same IP address</p>\n      <p>Only a single connection per IP address is permitted.</p>\n      <a route-href=\"route: home\" class=\"btn btn-primary btn-xs\" style=\"float: right\">Back home</a>\n\n<p>To authorize multiple logins from the same IP please <a href=\"mailto:${appSupportEmail}\"> contact us.</a></p>\n       \n     \n  </div>\n\n</template>\n\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('deposit-form',["require", "exports", "aurelia-framework", "aurelia-dialog", "aurelia-event-aggregator", "jquery", "./lib/util", "./shared/DataContainer", "./lib/api-service", "./shared/ClientMessage", "./shared/Currency", "./funding-window", "bootstrap-slider"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, aurelia_event_aggregator_1, $, util_1, DataContainer_1, api_service_1, ClientMessage_1, Currency_1, funding_window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DepositForm = (function () {
        function DepositForm(controller, util, ea, apiService) {
            var _this = this;
            this.controller = controller;
            this.util = util;
            this.ea = ea;
            this.apiService = apiService;
            this.paymentReceived = 0;
            this.checkingForPaymentLabel = 'Waiting for payment';
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(DataContainer_1.FundAccountResult, function (r) { return _this.handleFundAccountResult(r); }));
            this.subscriptions.push(ea.subscribe(DataContainer_1.AccountFunded, function (r) { return _this.handleAccountFunded(r); }));
            this.currencies = util.getCryptoCurrencies();
        }
        DepositForm.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        Object.defineProperty(DepositForm.prototype, "isCrypto", {
            get: function () {
                return this.currency && this.currency.toLowerCase() !== 'usd';
            },
            enumerable: true,
            configurable: true
        });
        DepositForm.prototype.handleFundAccountResult = function (result) {
            if (result.currency == this.currency) {
                this.fundAccountResult = result;
                this.paymentAddress = result.paymentAddress;
                this.blink();
            }
        };
        DepositForm.prototype.getPaymentLabel = function (seconds) {
            if (seconds === 0)
                return 'Checking payment...';
            return "Next checking for payment in " + seconds + " second" + (seconds > 1 ? 's' : '');
        };
        DepositForm.prototype.handleAccountFunded = function (result) {
            if (this.currency != result.currency)
                return;
            var isPlayMoney = result.currency == Currency_1.Currency.free;
            this.funded = isPlayMoney || (result.paymentReceived > 0 && result.confirmations >= this.fundAccountResult.requiredConfirmations);
            if (this.funded && this.seatnum != null) {
                this.playerStack = result.balance;
                this.setupSlider();
            }
            if (!isPlayMoney) {
                this.checkingForPaymentLabel = "Received " + result.confirmations + " of " + this.fundAccountResult.requiredConfirmations + " confirmations";
            }
            this.paymentReceived = result.paymentReceived;
            if (this.funded) {
                clearInterval(this.paymentTimer);
                if (this.seatnum != null) {
                    this.infoMessage = 'Use the slider below to select your buy-in amount';
                }
                else {
                    this.infoMessage = 'Your account has been funded';
                }
            }
            else
                this.paymentTimerStart = new Date();
        };
        DepositForm.prototype.setupSlider = function () {
            var _this = this;
            var min = this.tableConfig.bigBlind;
            var max = Math.min(this.tableConfig.maxBuyIn * min, this.playerStack);
            var maxUsd = this.util.toUsd(max, this.tableConfig.exchangeRate, this.tableConfig.currency);
            var minLabel = this.util.formatAmountWithUsd(min, this.tableConfig.currency, this.tableConfig.bigBlindUsd);
            var maxLabel = this.util.formatAmountWithUsd(max, this.tableConfig.currency, maxUsd);
            $(this.joinAmountInput).slider({
                min: min,
                max: max,
                step: 1,
                value: max,
                ticks: [min, max],
                ticks_labels: [minLabel, maxLabel],
            }).on('slide', function () {
                _this.joinAmountChanged();
            });
            this.joinAmountChanged();
        };
        DepositForm.prototype.joinAmountChanged = function () {
            var _this = this;
            var amount = this.getBuyInAmount();
            var tableConfig = this.util.tableConfigs.find(function (t) { return t.currency.toLowerCase() === _this.currency.toLowerCase(); });
            this.buyInAmount = this.util.toDisplayAmount(amount, tableConfig);
        };
        DepositForm.prototype.getBuyInAmount = function () {
            return parseFloat(this.joinAmountInput.value);
        };
        DepositForm.prototype.bind = function (bindingContext, overrideContext) {
            if (this.fundingWindowModel != null) {
                this.tableConfig = this.fundingWindowModel.tableConfig;
                this.currency = this.tableConfig.currency;
                this.seatnum = this.fundingWindowModel.seatnum;
                this.playerStack = this.fundingWindowModel.playerStack;
                this.infoMessage = 'Your account needs to be funded';
            }
        };
        DepositForm.prototype.currencyChanged = function () {
            clearInterval(this.backgroundInterval);
            this.fundAccountResult = null;
            this.paymentAddress = null;
            this.sendFundAccountRequest();
        };
        DepositForm.prototype.attached = function () {
            if (this.fundingWindowModel) {
                if (!this.playerStack) {
                    this.sendFundAccountRequest();
                }
                else {
                    this.setupSlider();
                    this.infoMessage = 'Use the slider below to select your buy-in amount';
                }
            }
            else {
                this.currency = this.currencies[0];
            }
        };
        DepositForm.prototype.sendFundAccountRequest = function () {
            console.log('deposit form sending sendFundAccountRequest');
            this.apiService.send(new ClientMessage_1.FundAccountRequest(this.currency));
        };
        DepositForm.prototype.copyAddress = function () {
            this.paymentAddressInput.select();
            document.execCommand("copy");
            this.paymentAddressInput.selectionStart = this.paymentAddressInput.selectionEnd;
            this.copied = true;
        };
        DepositForm.prototype.blink = function () {
            var _this = this;
            if (!this.paymentAddress)
                return;
            this.backgroundInterval = setInterval(function () {
                $(_this.waitingOnPayment).toggleClass("yellow-bg");
            }, 550);
        };
        __decorate([
            aurelia_framework_1.bindable,
            __metadata("design:type", funding_window_1.FundingWindowModel)
        ], DepositForm.prototype, "fundingWindowModel", void 0);
        __decorate([
            aurelia_framework_1.bindable,
            __metadata("design:type", Boolean)
        ], DepositForm.prototype, "hideCloseControls", void 0);
        __decorate([
            aurelia_framework_1.computedFrom('currency'),
            __metadata("design:type", Boolean),
            __metadata("design:paramtypes", [])
        ], DepositForm.prototype, "isCrypto", null);
        DepositForm = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, util_1.Util, aurelia_event_aggregator_1.EventAggregator, api_service_1.ApiService])
        ], DepositForm);
        return DepositForm;
    }());
    exports.DepositForm = DepositForm;
});



define('text!deposit-form.html', ['module'], function(module) { module.exports = "<template>\n    <require from=\"bootstrap-slider/dist/css/bootstrap-slider.min.css\"></require>\n    <require from=\"./lib/number-format\"></require>\n    <require from=\"./lib/crypto-format\"></require>\n    <require from='./resources/attributes/visibility-custom-attribute'></require>\n\n\n    <div if.bind=\"!fundingWindowModel\">\n        <span> Currency: </span>\n        <select class=\"form-control uppercase\" ref=\"currencySelect\" value.bind=\"currency\" change.delegate=\"currencyChanged()\" style=\"width:auto;display:inline-block;\">\n            <option repeat.for=\"currency of currencies\" value=\"${currency}\" style=\"padding:10px;\">${currency.toUpperCase()} </option>\n        </select>\n        <i if.bind=\"currency\" class=\"currency-icon currency-${currency} \"></i>\n    </div>\n\n    <h4 id=\"account-funded-info\" if.bind=\"fundingWindowModel\">\n        <i if.bind=\"isCrypto\" class=\"currency-icon currency-${currency} \"></i> ${infoMessage}\n    </h4>\n    \n    <p if.bind=\"fundingWindowModel\" class=\"funding-close-info\" show.bind=\"isCrypto && !playerStack\">You do not need to keep this window open. You will be notified when your account has been credited.</p>\n\n      <div class=\"funding-item\" show.bind=\"isCrypto && !playerStack\">\n        \n        <div style=\"display: inline-block;vertical-align: top;\" >\n          \n          <span class=\"uppercase\">${currency}</span>\n          <span> Payment Address: </span>\n      \n          <span show.bind=\"copied\" style=\"float: right;\">Copied!</span>\n          <span class=\"${copied ? 'drawn':''}\"></span>\n          <svg style=\"float: right; margin-right: 4px;\" version=\"1.1\" id=\"tick\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n            viewBox=\"0 0 37 37\" style=\"enable-background:new 0 0 37 37;\" xml:space=\"preserve\" height=\"16px\" width=\"16px\">\n            <path class=\"circ path\" style=\"fill:none;stroke:#000;stroke-width:3;stroke-linejoin:round;stroke-miterlimit:10;\" d=\"\n                    M30.5,6.5L30.5,6.5c6.6,6.6,6.6,17.4,0,24l0,0c-6.6,6.6-17.4,6.6-24,0l0,0c-6.6-6.6-6.6-17.4,0-24l0,0C13.1-0.2,23.9-0.2,30.5,6.5z\"\n            />\n            <polyline class=\"tick path\" style=\"fill:none;stroke:#000;stroke-width:3;stroke-linejoin:round;stroke-miterlimit:10;\" points=\"\n                    11.6,20 15.9,24.2 26.4,13.8 \" />\n          </svg>\n        \n        \n          <div>\n            <input class=\"funding-payment-address-input\" readonly=\"readonly\" value.bind=\"paymentAddress\" placeholder=\"Retrieving payment address - please wait\"\n              ref=\"paymentAddressInput\" />\n            <i class=\"fa fa-spinner fa-spin\" show.bind=\"!paymentAddress\"></i>\n            <i class=\"fa fa-clipboard\" show.bind=\"paymentAddress\" click.delegate=\"copyAddress()\"></i>\n        \n          </div>\n\n          <div class=\"funding-item\" id=\"waiting-for-funding\" css=\"visibility: ${paymentAddress && !funded ? 'visible':'hidden'}\">\n              <span class=\"waiting-on-payment\" ref=\"waitingOnPayment\">${checkingForPaymentLabel}</span>\n      \n            </div>\n      \n            <div class=\"funding-item\" show.bind=\"paymentAddress && !funded\">\n              <span>Amount Received: ${ paymentReceived | cryptoFormat:currency}</span>\n              <span class=\"uppercase\"> ${currency}\n                <i class=\"currency-icon currency-${currency}\"></i>\n              </span>\n            </div>\n        </div>\n\n        <div class=\"funding-window-qr-code\" css=\"visibility: ${fundAccountResult.addressQrCode ? 'visible':'hidden'}\">\n          <img alt=\"qrCode\" src.bind=\"fundAccountResult.addressQrCode\"  />\n        </div>\n\n      </div>\n      <div class=\"funding-item\" show.bind=\"fundingWindowModel && !isCrypto && !funded && !playerStack\">\n        <p>Please wait while we fund your account with play money</p>\n        <i class=\"fa fa-spinner fa-spin fa-2x fa-fw\"></i>\n      </div>\n\n      <div class=\"funding-item\" id=\"funding-payment-address\" css=\"visibility: ${paymentAddress && !funded ? 'visible':'hidden'}\">\n\n\n      </div>\n\n      \n\n      <div class=\"funding-item\" show.bind=\"funded\">\n        <span>${isCrypto ? 'Confirmed:' : 'Amount'}</span>\n        <span style=\"border: 1px solid black; font-size: 1.5em; padding: 0px 10px\">\n          <span  if.bind=\"isCrypto\">${ paymentReceived | cryptoFormat:currency}</span>\n          <span  if.bind=\"!isCrypto\">${ paymentReceived | numberFormat}</span>\n          <span class=\"uppercase\" if.bind=\"isCrypto\"> ${currency}</span>\n          <i class=\"fa fa-check\"></i>\n        </span>\n      </div>\n      <div class=\"row\">\n        <div class=\"col-lg-12\">\n          <div show.bind=\"playerStack && seatnum != null\">Your current buy-in amount: <b>${buyInAmount}</b></div>\n        </div>\n\n      </div>\n      <div class=\"row\" style=\"margin-top:10px;background-color: lightgray; padding: 10px;\" css=\"visibility: ${playerStack && seatnum != null ? 'visible':'hidden'}\" >\n        <div class=\"col-lg-3 col-lg-offset-1\" id=\"join-amount-slider-container\">\n          <input ref=\"joinAmountInput\" type=\"text\"/>\n\n        </div>\n\n      </div>\n\n      <div if.bind=\"!hideCloseControls\" style=\"margin-top: 20px;\">\n        <span click.trigger=\"controller.cancel()\" class=\"options-btn\" style=\"margin-right: 20px;\">Close</span>        \n        <span click.trigger=\"controller.ok(getBuyInAmount())\" show.bind=\"playerStack && seatnum != null\" class=\"options-btn funding-window-sit-down-button\">Sit Down at Seat ${seatnum+1}</span>\n      </div>\n    \n   \n</template>"; });
define('text!dealer-tray.html', ['module'], function(module) { module.exports = "<template>\n    <div>\n        <div class=\"chip-edge edge-1\" style=\"top: 65px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-1\" style=\"top: 68px;\">\n    <div class=\"chip-spot\" style=\"left: 7px;\"></div>\n</div>\n<div class=\"chip-edge edge-1\" style=\"top: 71px;\">\n    <div class=\"chip-spot\" style=\"left: 2px;\"></div>\n</div>\n<div class=\"chip-edge edge-1\" style=\"top: 74px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-1\" style=\"top: 77px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 65px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 68px;\">\n    <div class=\"chip-spot\" style=\"left: 2px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 71px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 74px;\">\n    <div class=\"chip-spot\" style=\"left: 4px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 77px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 80px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 83px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 86px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 89px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 92px;\">\n    <div class=\"chip-spot\" style=\"left: 7px;\"></div>\n</div>\n<div class=\"chip-edge edge-2\" style=\"top: 95px;\">\n    <div class=\"chip-spot\" style=\"left: 7px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 65px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 68px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 71px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 74px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 77px;\">\n    <div class=\"chip-spot\" style=\"left: 4px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 80px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 83px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 86px;\">\n    <div class=\"chip-spot\" style=\"left: 7px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 89px;\">\n    <div class=\"chip-spot\" style=\"left: 4px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 92px;\">\n    <div class=\"chip-spot\" style=\"left: 2px;\"></div>\n</div>\n<div class=\"chip-edge edge-3\" style=\"top: 95px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-4\" style=\"top: 65px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-4\" style=\"top: 68px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-4\" style=\"top: 71px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-4\" style=\"top: 74px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-4\" style=\"top: 77px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 65px;\">\n    <div class=\"chip-spot\" style=\"left: 6px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 68px;\">\n    <div class=\"chip-spot\" style=\"left: 2px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 71px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 74px;\">\n    <div class=\"chip-spot\" style=\"left: 4px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 77px;\">\n    <div class=\"chip-spot\" style=\"left: 2px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 80px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 83px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 86px;\">\n    <div class=\"chip-spot\" style=\"left: 4px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 89px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 92px;\">\n    <div class=\"chip-spot\" style=\"left: 8px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 95px;\">\n    <div class=\"chip-spot\" style=\"left: 5px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 98px;\">\n    <div class=\"chip-spot\" style=\"left: 4px;\"></div>\n</div>\n<div class=\"chip-edge edge-5\" style=\"top: 101px;\">\n    <div class=\"chip-spot\" style=\"left: 3px;\"></div>\n</div>\n</div>\n    </div>\n</template>"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('cash-out',["require", "exports", "aurelia-framework", "./lib/api-service", "./shared/ClientMessage", "jquery", "./lib/util"], function (require, exports, aurelia_framework_1, api_service_1, ClientMessage_1, $, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CashOut = (function () {
        function CashOut(apiService, util) {
            this.apiService = apiService;
            this.util = util;
        }
        CashOut.prototype.attached = function () {
            var _this = this;
            this.apiService.send(new ClientMessage_1.CashOutRequest());
            $('#pHistory').on('shown.bs.tab', function (e) {
                _this.apiService.send(new ClientMessage_1.PaymentHistoryRequest());
            });
            $('#depositTab').on('shown.bs.tab', function (e) {
                if (!_this.sentFundAccountRequest) {
                    _this.apiService.send(new ClientMessage_1.FundAccountRequest(_this.util.getCryptoCurrencies()[0]));
                    _this.sentFundAccountRequest = true;
                }
            });
        };
        CashOut = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService, util_1.Util])
        ], CashOut);
        return CashOut;
    }());
    exports.CashOut = CashOut;
});



define('text!cash-out.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"./withdrawl-form\"></require>\n  <require from=\"./deposit-form\"></require>\n  <require from=\"./payment-history\"></require>\n\n  <ux-dialog style=\"min-height: 450px;min-width: 450px\">\n    <ux-dialog-body>\n      <ul class=\"nav nav-tabs\">\n        <li class=\"active\"><a data-toggle=\"tab\" href=\"#withdraw\">Withdraw Funds</a></li>\n        <li><a data-toggle=\"tab\" href=\"#deposit\" id=\"depositTab\">Deposit Funds</a></li>\n        <li><a data-toggle=\"tab\" role=\"tab\" href=\"#paymentHistory\" id=\"pHistory\">Payment History</a></li>\n\n\n      </ul>\n      <div class=\"tab-content\">\n        <div id=\"withdraw\" class=\"tab-pane fade in active\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <withdrawl-form></withdrawl-form>\n            </div>\n          </div>\n        </div>\n\n        <div id=\"deposit\" class=\"tab-pane fade in\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <deposit-form></deposit-form>\n            </div>\n          </div>\n        </div>\n\n        <div id=\"paymentHistory\" class=\"tab-pane fade\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <payment-history></payment-history>\n            </div>\n          </div>\n        </div>\n\n\n\n      </div>\n\n    </ux-dialog-body>\n\n  </ux-dialog>\n</template>"; });
define('text!cards.css', ['module'], function(module) { module.exports = ".sprite {\n  background-image: url(\"images/cards-sprite.png\");\n  background-repeat: no-repeat;\n  display: block;\n  background-size: 5300%;\n  width: 150px;\n  height: 210px; }\n\n.sprite-small {\n  width: 45.71px;\n  height: 64px; }\n\n.sprite-10C-150 {\n  background-position: 0 0; }\n\n.sprite-10D-150 {\n  background-position: 1.92308% 0; }\n\n.sprite-10H-150 {\n  background-position: 3.84615% 0; }\n\n.sprite-10S-150 {\n  background-position: 5.76923% 0; }\n\n.sprite-2C-150 {\n  background-position: 7.69231% 0; }\n\n.sprite-2D-150 {\n  background-position: 9.61538% 0; }\n\n.sprite-2H-150 {\n  background-position: 11.53846% 0; }\n\n.sprite-2S-150 {\n  background-position: 13.46154% 0; }\n\n.sprite-3C-150 {\n  background-position: 15.38462% 0; }\n\n.sprite-3D-150 {\n  background-position: 17.30769% 0; }\n\n.sprite-3H-150 {\n  background-position: 19.23077% 0; }\n\n.sprite-3S-150 {\n  background-position: 21.15385% 0; }\n\n.sprite-4C-150 {\n  background-position: 23.07692% 0; }\n\n.sprite-4D-150 {\n  background-position: 25% 0; }\n\n.sprite-4H-150 {\n  background-position: 26.92308% 0; }\n\n.sprite-4S-150 {\n  background-position: 28.84615% 0; }\n\n.sprite-5C-150 {\n  background-position: 30.76923% 0; }\n\n.sprite-5D-150 {\n  background-position: 32.69231% 0; }\n\n.sprite-5H-150 {\n  background-position: 34.61538% 0; }\n\n.sprite-5S-150 {\n  background-position: 36.53846% 0; }\n\n.sprite-6C-150 {\n  background-position: 38.46154% 0; }\n\n.sprite-6D-150 {\n  background-position: 40.38462% 0; }\n\n.sprite-6H-150 {\n  background-position: 42.30769% 0; }\n\n.sprite-6S-150 {\n  background-position: 44.23077% 0; }\n\n.sprite-7C-150 {\n  background-position: 46.15385% 0; }\n\n.sprite-7D-150 {\n  background-position: 48.07692% 0; }\n\n.sprite-7H-150 {\n  background-position: 50% 0; }\n\n.sprite-7S-150 {\n  background-position: 51.92308% 0; }\n\n.sprite-8C-150 {\n  background-position: 53.84615% 0; }\n\n.sprite-8D-150 {\n  background-position: 55.76923% 0; }\n\n.sprite-8H-150 {\n  background-position: 57.69231% 0; }\n\n.sprite-8S-150 {\n  background-position: 59.61538% 0; }\n\n.sprite-9C-150 {\n  background-position: 61.53846% 0; }\n\n.sprite-9D-150 {\n  background-position: 63.46154% 0; }\n\n.sprite-9H-150 {\n  background-position: 65.38462% 0; }\n\n.sprite-9S-150 {\n  background-position: 67.30769% 0; }\n\n.sprite-AC-150 {\n  background-position: 69.23077% 0; }\n\n.sprite-AD-150 {\n  background-position: 71.15385% 0; }\n\n.sprite-AH-150 {\n  background-position: 73.07692% 0; }\n\n.sprite-AS-150 {\n  background-position: 75% 0; }\n\n.sprite-JC-150 {\n  background-position: 76.92308% 0; }\n\n.sprite-JD-150 {\n  background-position: 78.84615% 0; }\n\n.sprite-JH-150 {\n  background-position: 80.76923% 0; }\n\n.sprite-JS-150 {\n  background-position: 82.69231% 0; }\n\n.sprite-KC-150 {\n  background-position: 84.61538% 0; }\n\n.sprite-KD-150 {\n  background-position: 86.53846% 0; }\n\n.sprite-KH-150 {\n  background-position: 88.46154% 0; }\n\n.sprite-KS-150 {\n  background-position: 90.38462% 0; }\n\n.sprite-QC-150 {\n  background-position: 92.30769% 0; }\n\n.sprite-QD-150 {\n  background-position: 94.23077% 0; }\n\n.sprite-QH-150 {\n  background-position: 96.15385% 0; }\n\n.sprite-QS-150 {\n  background-position: 98.07692% 0; }\n\n.sprite-Red_Back-150 {\n  background-position: 100% 0; }\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('betting-controls',["require", "exports", "aurelia-framework", "./lib/util", "./lib/api-service", "jquery", "aurelia-event-aggregator", "./messages", "./shared/ClientMessage", "./shared/Currency", "./shared/CommonHelpers", "aurelia-dialog", "./message-window", "bootstrap-slider"], function (require, exports, aurelia_framework_1, util_1, api_service_1, $, aurelia_event_aggregator_1, messages_1, ClientMessage_1, Currency_1, CommonHelpers_1, aurelia_dialog_1, message_window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BettingControls = (function () {
        function BettingControls(apiService, util, ea, dialogService) {
            var _this = this;
            this.apiService = apiService;
            this.util = util;
            this.ea = ea;
            this.dialogService = dialogService;
            this.betShortcut4 = 'All in';
            this.subscriptions = [];
            this.subscriptions.push(ea.subscribe(messages_1.SetBettingControlsEvent, function (r) { return _this.setBettingControls(r.seat, r.game); }));
        }
        BettingControls.prototype.detached = function () {
            for (var _i = 0, _a = this.subscriptions; _i < _a.length; _i++) {
                var sub = _a[_i];
                sub.dispose();
            }
        };
        BettingControls.prototype.setBettingControls = function (seat, game) {
            this.seat = seat;
            this.callBtnDisabled = false;
            this.betBtnDisabled = false;
            this.foldBtnDisabled = false;
            if (!seat || !seat.myturn) {
                this.canCall = false;
                this.myturn = false;
                return;
            }
            this.myturn = true;
            this.tocall = game.tocall;
            this.lastRaise = game.lastRaise;
            this.setupBetSlider(seat, game);
            var tableConfig = this.util.currentTableConfig;
            if (!tableConfig)
                return;
            var canRaise = game.tocall <= seat.stack - Math.max(tableConfig.bigBlind, this.lastRaise);
            this.canCall = game.tocall == 0 || canRaise || game.tocall < seat.stack;
            this.callButtonText = game.tocall > 0 ? 'Call' : 'Check';
            this.callButtonInfo = game.tocall > 0 ? '(' + this.util.toDisplayAmount(game.tocall) + ')' : '';
            if (!canRaise) {
                this.betAmount = seat.stack + seat.bet;
                this.betButtonText = 'All in';
                this.betButtonInfo = '(' + this.util.toDisplayAmount(seat.stack) + ')';
            }
            else {
                this.betButtonText = 'Raise To';
                if (seat.bet > 0) {
                }
                else {
                    this.betButtonText = 'Bet';
                    this.betButtonInfo = '';
                }
            }
            this.setBetButtonRaiseInfo();
            this.betShortcut4Amt = seat.stack + seat.bet;
            if (tableConfig) {
                if (game.board && game.board.length) {
                    var potAmount = game.pot[0];
                    this.betShortcut1 = "1/2 Pot";
                    if (tableConfig.currency === Currency_1.Currency.free)
                        this.betShortcut1Amt = parseFloat((potAmount / 2).toFixed(2));
                    else
                        this.betShortcut1Amt = Math.round(potAmount / 2);
                    this.betShortcut2 = "Pot";
                    this.betShortcut2Amt = potAmount;
                    this.betShortcut3 = "2x Pot";
                    this.betShortcut3Amt = potAmount * 2;
                }
                else {
                    this.betShortcut1 = "2x";
                    this.betShortcut1Amt = tableConfig.bigBlind * 2;
                    this.betShortcut2 = "3x";
                    this.betShortcut2Amt = tableConfig.bigBlind * 3;
                    this.betShortcut3 = "5x";
                    this.betShortcut3Amt = tableConfig.bigBlind * 5;
                }
            }
        };
        BettingControls.prototype.handleBetShortcut = function (amount) {
            this.betAmount = parseFloat(amount);
            this.betInput = this.util.toDisplayAmount(this.betAmount);
            this.setBetButtonRaiseInfo();
            this.util.playSound(this.apiService.audioFiles.betShortcut);
        };
        BettingControls.prototype.betInputChanged = function () {
            this.betAmount = this.util.fromDisplayAmount(this.betInput);
            this.setBetButtonRaiseInfo();
        };
        BettingControls.prototype.setBetButtonRaiseInfo = function () {
            this.betButtonInfo = !isNaN(this.betAmount) ? this.util.toDisplayAmount(this.betAmount) : '';
        };
        BettingControls.prototype.setupBetSlider = function (seat, game) {
            var _this = this;
            var tableConfig = this.util.currentTableConfig;
            if (!tableConfig)
                return;
            this.sliderMax = seat.stack + seat.bet;
            var minRaise = game.tocall + seat.bet + Math.max(tableConfig.bigBlind, this.lastRaise);
            minRaise = Math.min(minRaise, this.sliderMax);
            this.sliderMin = minRaise;
            this.betAmount = minRaise;
            this.betSlider = minRaise + '';
            this.betInput = this.util.toDisplayAmount(this.betAmount);
            this.sliderStep = 1;
            if ($.data(this.sliderInput, "slider"))
                $(this.sliderInput).slider('destroy');
            var options = {
                min: this.sliderMin,
                max: this.sliderMax,
                step: this.sliderStep,
                value: this.betAmount,
                scale: tableConfig.currency === Currency_1.Currency.free ? 'logarithmic' : 'linear'
            };
            $(this.sliderInput).slider(options).on('slide', function () {
                _this.betSliderChanged();
            });
        };
        BettingControls.prototype.attached = function () {
        };
        BettingControls.prototype.betSliderChanged = function () {
            this.betAmount = parseFloat(this.sliderInput.value);
            this.betInput = this.util.toDisplayAmount(this.betAmount);
            this.setBetButtonRaiseInfo();
        };
        BettingControls.prototype.fold = function () {
            if (this.foldBtnDisabled) {
                return;
            }
            this.foldBtnDisabled = true;
            this.myturn = false;
            this.apiService.loadSounds();
            var message = new ClientMessage_1.ClientMessage();
            message.fold = new ClientMessage_1.FoldRequest();
            message.fold.tableId = this.util.currentTableId;
            this.apiService.sendMessage(message);
        };
        BettingControls.prototype.call = function () {
            if (this.callBtnDisabled) {
                return;
            }
            this.callBtnDisabled = true;
            this.myturn = false;
            this.apiService.loadSounds();
            this.sendBet(this.tocall);
        };
        BettingControls.prototype.sendBet = function (amount) {
            var message = new ClientMessage_1.ClientMessage();
            message.bet = new ClientMessage_1.BetRequest();
            message.bet.tableId = this.util.currentTableId;
            message.bet.amount = amount;
            this.apiService.sendMessage(message);
        };
        BettingControls.prototype.bet = function () {
            if (this.betBtnDisabled) {
                return;
            }
            this.apiService.loadSounds();
            var thisBet;
            if (this.betButtonText.indexOf('All in') !== -1) {
                thisBet = this.betAmount;
            }
            else {
                thisBet = this.betAmount;
                if (!CommonHelpers_1.isNumeric(thisBet)) {
                    this.showWarning('Not a valid Bet size');
                    return;
                }
                if (this.betInput === this.util.toDisplayAmount(this.seat.stack)) {
                    thisBet = this.seat.stack;
                }
                else {
                    var raise = thisBet - this.seat.bet;
                    if (raise > this.tocall && raise - this.tocall < this.util.currentTableConfig.bigBlind) {
                        var betRaiseName = this.tocall == -0 ? "Bet of" : "Raise to";
                        this.showWarning(betRaiseName + " " + thisBet + " is invalid. The minimum " + betRaiseName + " must be at least the big blind of " + this.util.currentTableConfig.bigBlind);
                        return;
                    }
                }
            }
            this.betBtnDisabled = true;
            this.myturn = false;
            thisBet -= this.seat.bet;
            this.sendBet(thisBet);
        };
        BettingControls.prototype.showWarning = function (message) {
            this.dialogService.open({ viewModel: message_window_1.MessageWindow, model: message, lock: false });
        };
        BettingControls = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService, util_1.Util, aurelia_event_aggregator_1.EventAggregator, aurelia_dialog_1.DialogService])
        ], BettingControls);
        return BettingControls;
    }());
    exports.BettingControls = BettingControls;
});



define('text!betting-controls.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"bootstrap-slider/dist/css/bootstrap-slider.min.css\"></require>\n  <div id=\"betting-shortcuts\" show.bind=\"myturn && canCall\">\n    <span class=\"btn\" data-amount.bind=\"betShortcut1Amt\" click.delegate=\"handleBetShortcut(betShortcut1Amt)\">${betShortcut1}</span>\n    <span class=\"btn\" click.delegate=\"handleBetShortcut(betShortcut2Amt)\">${betShortcut2}</span>\n    <span class=\"btn\" click.delegate=\"handleBetShortcut(betShortcut3Amt)\">${betShortcut3}</span>\n    <span class=\"btn\" click.delegate=\"handleBetShortcut(betShortcut4Amt)\">${betShortcut4}</span>\n  </div>\n  \n\n  <button class=\"btn bet-action-button\" show.bind=\"myturn || foldBtnDisabled\" id=\"fold\" click.delegate=\"fold()\" disabled.bind=\"foldBtnDisabled\">\n    <span show.bind=\"!foldBtnDisabled\">Fold</span>\n    <span show.bind=\"foldBtnDisabled\"><i class=\"fa fa-spinner fa-spin\"></i></span>\n  </button>\n\n  <button class=\"btn bet-action-button\" id=\"check\" show.bind=\"(myturn && canCall) || callBtnDisabled\" click.delegate=\"call()\" disabled.bind=\"callBtnDisabled\">\n    <div show.bind=\"!callBtnDisabled\" class=\"action-button-action\">${callButtonText}</div>\n    <div show.bind=\"!callBtnDisabled\" class=\"action-button-info\">${callButtonInfo}</div>\n    <span show.bind=\"callBtnDisabled\"><i class=\"fa fa-spinner fa-spin\"></i></span>\n  </button>\n\n\n  <button class=\"btn bet-action-button\" id=\"bet\" show.bind=\"myturn || betBtnDisabled\" click.delegate=\"bet()\" disabled.bind=\"betBtnDisabled\">\n    <div show.bind=\"!betBtnDisabled\" class=\"action-button-action\">${betButtonText}</div>\n    <div show.bind=\"!betBtnDisabled\" class=\"action-button-info\">${betButtonInfo}</div>\n    <span show.bind=\"betBtnDisabled\"><i class=\"fa fa-spinner fa-spin\"></i></span>\n  </button>\n\n  <!--<input min.bind=\"sliderMin\" max.bind=\"sliderMax\" step.bind=\"sliderStep\" type=\"range\" id=\"bet_slider\" show.bind=\"canCall\" change.delegate=\"betSliderChanged()\" input.delegate=\"betSliderChanged()\" value.bind=\"betSlider\">-->  \n  <div id=\"bet_slider\" show.bind=\"myturn && canCall\">\n    <input  ref=\"sliderInput\" type=\"text\" />\n  </div>\n  \n  \n  <input type=\"text\" id=\"bet-amount\" show.bind=\"myturn && canCall\" keyup.trigger=\"betInputChanged()\" value.bind=\"betInput\" onfocusout.bind=\"betInputFocousout()\">\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define('app',["require", "exports", "aurelia-framework", "./account-settings", "aurelia-dialog", "./lib/api-service", "./login-popup", "jquery", "./lib/util"], function (require, exports, aurelia_framework_1, account_settings_1, aurelia_dialog_1, api_service_1, login_popup_1, $, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var App = (function () {
        function App(dialogService, apiService, util) {
            this.dialogService = dialogService;
            this.apiService = apiService;
            this.util = util;
            this.message = 'Tournament Starting Soon - ';
            this.infoBannerActive = true;
            this.year = new Date().getFullYear();
        }
        Object.defineProperty(App.prototype, "appName", {
            get: function () {
                return this.apiService.version == null ? '' : this.apiService.version.appName;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(App.prototype, "appSupportEmail", {
            get: function () {
                return this.apiService.version == null ? '' : this.apiService.version.appSupportEmail;
            },
            enumerable: true,
            configurable: true
        });
        App.prototype.configureRouter = function (config, router) {
            config.map([
                { route: '', name: 'home', moduleId: 'poker-table' },
                { route: 'faq/', moduleId: 'faq', name: 'faq' },
                { route: 'duplicate-ip/', moduleId: 'duplicate-ip', name: 'duplicate-ip' },
                { route: 'logged-out/', moduleId: 'logged-out', name: 'logged-out' },
                { route: 'activate/', moduleId: 'activate', name: 'activate' },
                { route: 'reset/', moduleId: 'reset-password-form', },
            ]);
            this.router = router;
        };
        App.prototype.openLoginWindow = function () {
            this.ensureOnHomePage();
            this.dialogService.open({ viewModel: login_popup_1.LoginPopup });
        };
        App.prototype.openMyAccount = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.ensureOnHomePage();
                    this.apiService.loadSounds();
                    this.openAccountDialog();
                    return [2];
                });
            });
        };
        App.prototype.ensureOnHomePage = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.router.currentInstruction.config.name !== 'home')) return [3, 2];
                            this.router.navigate('');
                            return [4, this.apiService.waitForSocket()];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2];
                    }
                });
            });
        };
        App.prototype.openAccountDialog = function () {
            this.dialogService.open({ viewModel: account_settings_1.AccountSettings, lock: false });
        };
        App.prototype.closeBanner = function () {
            $(this.infoBannerDiv).fadeOut("slow");
        };
        App = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogService, api_service_1.ApiService, util_1.Util])
        ], App);
        return App;
    }());
    exports.App = App;
});



define('text!app.html', ['module'], function(module) { module.exports = "<template>\n  <a class=\"github-fork-ribbon\" target=\"_blank\" href=\"https://github.com/wallaceturner/crypto-poker\" data-ribbon=\"Fork me on GitHub\" title=\"Fork me on GitHub\">Fork me on GitHub</a>\n\n  <require from=\"bootstrap/css/bootstrap.css\"></require>\n  <require from=\"./style.css\"></require>  \n  <require from=\"./cards.css\"></require>  \n  <require from=\"./flags16.css\"></require>  \n\n  <div class=\"navbar navbar-default navbar-fixed-top\">\n  <div class=\"container\">\n    <div class=\"navbar-header\">\n      <a href=\"../\" class=\"navbar-brand\"><span class=\"nav-logo\"/></a>\n      <button class=\"navbar-toggle\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbar-main\">\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n      </button>\n    </div>\n    <div class=\"navbar-collapse collapse\" id=\"navbar-main\">\n      <ul class=\"nav navbar-nav\">\n        <!-- <li><a route-href=\"route: home\">Tables</a></li> -->\n        <li class=\"dropdown\"><a class=\"dropdown-toggle\" data-toggle=\"dropdown\" href=\"#\" id=\"themes\" click.delegate=\"openMyAccount()\">My Account</a></li>\n        <li class=\"dropdown\" show.bind=\"!apiService.authenticated\"><a class=\"dropdown-toggle\" data-toggle=\"dropdown\" href=\"#\" id=\"themes\" click.delegate=\"openLoginWindow()\">Login</a></li>\n        <li><a href=\"#\" route-href=\"route: faq\">Help/FAQ</a></li>      \n        <li class=\"dropdown hidden-md hidden-sm hidden-xs\">\n            \n          <a class=\"dropdown-toggle \" data-toggle=\"dropdown\" href=\"#\"> </span>Buy DASH <span class=\"nav-dash-icon\"></span> \n\n          <span class=\"caret\"></span>\n        \n        </a>\n          <ul class=\"dropdown-menu\">\n            <li></span> <a href=\"https://coinspot.com.au\" target=\"_blank\"><span class=\"coinspot-icon\"></span> coinspot.com.au (Australia)</a></li>\n            <li><a href=\"https://bitpanda.com \" target=\"_blank\"><span class=\"bitpanda-icon\"></span> bitpanda.com (Europe)</a></li>\n            <li><a href=\"https://www.dash.org/direct-purchase/\" target=\"_blank\">Other Vendors</a></li>\n          </ul>\n        </li>  \n      </ul>\n\n      <ul class=\"nav navbar-nav navbar-right hidden-md hidden-sm hidden-xs\">\n        <li><a href=\"https://www.dash.org/\" target=\"_blank\">Instant Payments by <span class=\"dash-logo-header\"></span></a></li>\n        \n      </ul>\n      \n    </div>\n  </div>\n</div>\n  \n  \n  <!--<div class=\"container-fluid\">\n    <div class=\"row\">\n      <div class=\"col-lg-12\" style=\"background-color: #fff\">\n        <compose view=\"info.html\" containerless></compose>\n      </div>\n      \n    </div>\n   \n  </div>-->\n  \n  <!-- <div class=\"info-banner\" ref=\"infoBannerDiv\" show.bind=\"infoBannerActive\">\n    <i class=\"fa fa-trophy\"></i> ${message} <i class=\"fa fa-trophy\"></i>\n    <span class=\"fa fa-close info-close\" click.trigger=\"closeBanner()\"></span>\n  </div>   -->\n  <div class=\"container-fluid\">\n    <div class=\"row\">\n      <div class=\"col-lg-12\">      \n        \n        <div class=\"centerBlock\">\n          <router-view></router-view>          \n        </div>                \n      </div>      \n    </div>\n  </div>\n\n  \n  \n  <footer class=\"panel-footer-ex\">\n    <p class=\"footer-content\">&copy; ${year} ${appName} Contact Support: <a href=\"mailto:${appSupportEmail}\">${appSupportEmail}</a></p>\n  </footer>\n  <!-- set background color here otherwise if you do it at top of page aurelia loads it before the splash has finished and it makes the transparent logo look werid -->\n  <style>    \n    body {\n      background-color: lightgray;      \n    }\n  </style>\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define('activate',["require", "exports", "./lib/api-service", "aurelia-event-aggregator", "aurelia-router", "aurelia-framework", "./shared/activate-request", "./lib/utility"], function (require, exports, api_service_1, aurelia_event_aggregator_1, aurelia_router_1, aurelia_framework_1, activate_request_1, utility) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Activate = (function () {
        function Activate(api, router, ea) {
            this.api = api;
            this.router = router;
            this.ea = ea;
            this.loading = true;
        }
        Activate.prototype.attached = function () {
            return __awaiter(this, void 0, void 0, function () {
                var request, tournamentId, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            request = new activate_request_1.ActivateRequest();
                            request.token = utility.getParameterByName('token');
                            tournamentId = utility.getParameterByName('tournamentId');
                            _a = this;
                            return [4, this.api.activate(request)];
                        case 1:
                            _a.result = _b.sent();
                            this.loading = false;
                            if (this.result.success) {
                                if (tournamentId) {
                                    localStorage.setItem("registerForTournamentId", tournamentId);
                                }
                                localStorage.setItem("sid", this.result.sid);
                                setTimeout(function () {
                                    window.location.href = '/';
                                }, 2000);
                            }
                            return [2];
                    }
                });
            });
        };
        Activate = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [api_service_1.ApiService, aurelia_router_1.Router, aurelia_event_aggregator_1.EventAggregator])
        ], Activate);
        return Activate;
    }());
    exports.Activate = Activate;
});



define('text!activate.html', ['module'], function(module) { module.exports = "<template>\n  <div class=\"container\" style=\"padding: 100px 0;\">\n    <div class=\"row\">\n      <div class=\"text-center\">\n        <div show.bind=\"loading\">Verifying please wait...\n          <i class=\"fa fa-spinner fa-spin\"></i>\n        </div>\n\n        <div class=\"alert alert-dismissible alert-danger\" show.bind=\"result.errorMessage\">\n          <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\n\n          <p>${result.errorMessage}</p>\n        </div>\n        \n\n        <div class=\"alert alert-dismissible alert-success\" show.bind=\"result.success\">\n          <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button>\n          <p>${result.message}</p>\n          <p>Redirecting to Tables...\n            <i class=\"fa fa-spinner fa-spin\"></i>\n          </p>\n        </div>\n      </div>\n    </div>\n  </div>\n\n\n</template>\n"; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('account-settings',["require", "exports", "aurelia-framework", "aurelia-dialog", "jquery", "./lib/api-service", "./shared/ClientMessage", "./lib/util"], function (require, exports, aurelia_framework_1, aurelia_dialog_1, $, api_service_1, ClientMessage_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AccountSettings = (function () {
        function AccountSettings(controller, apiService, util) {
            this.controller = controller;
            this.apiService = apiService;
            this.util = util;
        }
        AccountSettings.prototype.attached = function () {
            var _this = this;
            $(this.historyTab).on('shown.bs.tab', function (e) {
                _this.apiService.send(new ClientMessage_1.PaymentHistoryRequest());
            });
            $(this.withdrawTab).on('shown.bs.tab', function (e) {
                _this.apiService.send(new ClientMessage_1.CashOutRequest());
            });
            $(this.depositTab).on('shown.bs.tab', function (e) {
                if (!_this.sentFundAccountRequest) {
                    _this.apiService.send(new ClientMessage_1.FundAccountRequest(_this.util.getCryptoCurrencies()[0]));
                    _this.sentFundAccountRequest = true;
                }
            });
        };
        AccountSettings = __decorate([
            aurelia_framework_1.autoinject(),
            __metadata("design:paramtypes", [aurelia_dialog_1.DialogController, api_service_1.ApiService, util_1.Util])
        ], AccountSettings);
        return AccountSettings;
    }());
    exports.AccountSettings = AccountSettings;
});



define('text!account-settings.html', ['module'], function(module) { module.exports = "<template>  \n  <require from=\"./user-settings\"></require>\n  <require from=\"./withdrawl-form\"></require>\n  <require from=\"./transfer-funds\"></require>\n  <require from=\"./payment-history\"></require>  \n  <require from=\"./deposit-form\"></require>\n  <ux-dialog>\n    <ux-dialog-body>\n      \n      <ul class=\"nav nav-tabs\">\n        <li class=\"active\"><a data-toggle=\"tab\" href=\"#users\">Settings</a></li>        \n        <li><a data-toggle=\"tab\" role=\"tab\" href=\"#withdrawFunds\" ref=\"withdrawTab\">Withdraw</a></li>\n        <li><a data-toggle=\"tab\" role=\"tab\" href=\"#depositFunds\" ref=\"depositTab\">Deposit</a></li>\n        <li><a data-toggle=\"tab\" role=\"tab\" href=\"#paymentHistory\" ref=\"historyTab\">Payment History</a></li>\n        <li><a data-toggle=\"tab\" href=\"#reconcilliation\">Send Funds</a></li>\n        \n      </ul>\n      <div class=\"tab-content\">\n        <div id=\"users\" class=\"tab-pane fade in active\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <user-settings></user-settings>              \n            </div>\n          </div>\n        </div>\n        <div id=\"withdrawFunds\" class=\"tab-pane fade\">\n            <div class=\"row well\">\n              <div class=\"col-lg-12\">\n                  <withdrawl-form></withdrawl-form>\n              </div>\n            </div>\n          </div>\n        <div id=\"depositFunds\" class=\"tab-pane fade\">\n            <div class=\"row well\">\n              <div class=\"col-lg-12\">\n                <deposit-form hide-close-controls.bind=\"true\"></deposit-form>\n              </div>\n            </div>\n          </div>\n        <div id=\"paymentHistory\" class=\"tab-pane fade\">\n            <div class=\"row well\">\n              <div class=\"col-lg-12\">\n                <payment-history></payment-history>\n              </div>\n            </div>\n          </div>\n\n        <div id=\"reconcilliation\" class=\"tab-pane fade\">\n          <div class=\"row well\">\n            <div class=\"col-lg-12\">\n              <transfer-funds></transfer-funds>              \n            </div>\n          </div>\n        </div>\n        \n\n      </div>\n\n\n      \n\n\n    </ux-dialog-body>\n    <ux-dialog-footer>\n      <button click.trigger=\"controller.cancel()\">Close</button>\n    </ux-dialog-footer>\n  </ux-dialog>\n</template>\n"; });
//# sourceMappingURL=app-bundle.js.map