(function () {

    WinJS.Namespace.define("App.UI", {

        convertToString: function (HTMLString) {
            var textToReturn = "";

            for (i = 0; i <= HTMLString.length; i++) {
                var curchar = HTMLString.charAt(i);
                (curchar == "<") ? textToReturn += "&lt;" :
                (curchar == ">") ? textToReturn += "&gt;" :
                (curchar == "&") ? textToReturn += "&amp;" :
                (curchar == '"') ? textToReturn += "&quot;" :
                        textToReturn += HTMLString.charAt(i);
            }


            return textToReturn;
        },

        confirm: function (x, y) {
            return new WinJS.Promise(function (c) {
                y = y || "";
                var msgDialog = Windows.UI.Popups.MessageDialog(x, y);
                msgDialog.commands.append(new Windows.UI.Popups.UICommand("OK", c));
                msgDialog.commands.append(new Windows.UI.Popups.UICommand("Cancel", c));
                msgDialog.showAsync();
            });
        },

        current: null,

        errorMsg: function (error) {
            try {
                error.name = error.name || "";
                Windows.UI.Popups.MessageDialog(error.message, error.name).showAsync();
            } catch (AccessDenied) { null; }
        },

        theme: WinJS.Binding.as({
            background: null,
            backimage: null,
            titleColor: null,
            listBack: null,
            listColor: null,
            change: 0
        }),

        displayInt: function (num, digits) {
            digits = digits || 2;
            if (num < Math.pow(10, digits - 1)) {
                return "0" + "" + num;
            } else {
                return num.toString();
            }
        }

    });

    WinJS.Namespace.define("App.Nav", {
        reload: function () {
            WinJS.Navigation.navigate(WinJS.Navigation.location);
            WinJS.Navigation.back();
        }
    });


    WinJS.Namespace.define("App.FileSystem", {
        data: WinJS.Binding.as({
            _to_dos: new WinJS.Binding.List(),
            _taskArray: new WinJS.Binding.List(),
            change: 0
        }),

        dataFile: "notes.xml",

        readDataFile: function () {
            return new WinJS.Promise(function (c, e, p) {
                "use strict";
                var localState = WinJS.Application.local;
                localState.readText(App.FileSystem.dataFile).done(
                    function (ex) {
                        c(ex);
                    },
                    function (err) {
                        e(err);
                    },
                    function () {
                        p();
                    }
                    );
            });
        }

    });

    WinJS.Namespace.define("App.Style", {
        ListBox: WinJS.Class.define(
            function (element, options) {
                try {
                    var _sign = (Math.round(Math.random()) == 0) ? "-" : "";
                    element.parentElement.parentElement.style.transform = "rotate(" + _sign + Math.random() * 5 + "deg)";
                    element.parentNode.parentNode.style.opacity = Math.max(0.8, Math.random());
                } catch (Error) { null; }
            }
            )
    });

    WinJS.Namespace.define("App.PurchaseStatus", {
        currentApp: Windows.ApplicationModel.Store.CurrentApp,

        charLimit: function () {
            return 100;
        },

        trial: function () {
            return this.currentApp.licenseInformation.isTrial;
        }

    });

    WinJS.Namespace.define("App.Controls", {
        TimePicker: WinJS.Class.define(
            function (element, options) {
                if (options.type) {
                    switch (options.type) {
                        case "hour":
                            for (var i = 1; i <= 12; i++) {
                                var newOption = document.createElement("option");
                                newOption.value = App.UI.displayInt(i, 2);
                                newOption.innerText = App.UI.displayInt(i, 2);
                                element.appendChild(newOption);
                            }
                            break;
                        case "min":
                            for (var i = 0; i < 60; i++) {
                                var newOption = document.createElement("option");
                                newOption.value = App.UI.displayInt(i, 2);
                                newOption.innerText = App.UI.displayInt(i, 2);
                                element.appendChild(newOption);
                            }
                            break;
                    }
                }
            }
        ),

        DatePicker: WinJS.Class.define(
            function (element, options) {
                this._element = element;
                this._options = options;
                if (options.type) {
                    switch (options.type) {
                        case "year":
                            var currentYear = new Date().getFullYear();
                            var newYear = currentYear;
                            while (newYear < currentYear + 3) {
                                var newOption = document.createElement("option");
                                newOption.value = newYear.toString();
                                newOption.innerText = newYear.toString();
                                element.appendChild(newOption);
                                newYear++;
                            }
                            break;
                        case "month":
                            var currentMonth = new Date().getMonth() + 1;
                            for (var i = 1; i <= 12; i++) {
                                var newOption = document.createElement("option");
                                newOption.value = App.UI.displayInt(i, 2);
                                newOption.innerText = App.UI.displayInt(i, 2);
                                element.appendChild(newOption);
                            }
                            break;
                        case "day":
                            var currentYear = new Date().getYear();
                            var currentMonth = new Date().getMonth() + 1;
                            this.setDay(currentYear, currentMonth);
                            break;
                    }

                }
            },
            {

                setDay: function (_year, _month) {
                    var element = this._element;
                    var options = this._options;
                    if (options.type == "day" && (_year || options.yearid) && (_month || options.monthid)) {
                        var currentYear = _year || document.getElementById(options.yearid).value;
                        var currentMonth = _month || document.getElementById(options.monthid).value;
                        var monthSize;
                        if (currentMonth % 2 == 0 && currentMonth < 7) {
                            monthSize = (currentMonth == 2) ? 28 : 30;
                        } else {
                            if (currentMonth % 2 == 0) {
                                monthSize = 31;
                            } else {
                                if (currentMonth <= 7) {
                                    monthSize = 31;
                                } else {
                                    monthSize = 30;
                                }
                            }
                        }
                        if (currentYear % 4 == 0 && currentMonth == 2) {
                            monthSize = 29;
                        }
                        element.innerHTML = "";
                        for (var i = 1; i <= monthSize; i++) {
                            var newOption = document.createElement("option");
                            newOption.value = App.UI.displayInt(i, 2)
                            newOption.innerText = App.UI.displayInt(i, 2);
                            element.appendChild(newOption);
                        }
                    }
                }
            }
        )

    });

})();