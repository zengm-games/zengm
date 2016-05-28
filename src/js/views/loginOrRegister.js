const g = require('../globals');
const ui = require('../ui');
const $ = require('jquery');
const account = require('../util/account');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

function uiFirst() {
    ui.title("Login or Register");

    const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

    const $login = $("#login");
    const $register = $("#register");

    $login.on("submit", event => {
        event.preventDefault();

        // Reset error display
        document.getElementById("login-error").innerHTML = "";

        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/login.php`,
            data: `${$login.serialize()}&sport=${g.sport}`,
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: async data => {
                if (data.success) {
                    g.vm.topMenu.username(data.username);
                    g.vm.topMenu.email(data.email);
                    g.vm.topMenu.goldUntil(data.gold_until);
                    g.vm.topMenu.goldCancelled(data.gold_cancelled);

                    // Check for participation achievement, if this is the first time logging in to this sport
                    const achievements = await account.getAchievements();
                    if (achievements[0].count === 0) {
                        await account.addAchievements(["participation"]);
                    }
                    ui.realtimeUpdate(["account"], "/account");
                } else {
                    document.getElementById("login-error").innerHTML = "Invalid username or password.";
                }
            },
            error: () => {
                document.getElementById("login-error").innerHTML = ajaxErrorMsg;
            }
        });
    });

    $register.on("submit", event => {
        event.preventDefault();

        // Reset error display
        document.getElementById("register-error").innerHTML = "";
        document.getElementById("register-username").parentNode.classList.remove("has-error");
        document.getElementById("register-email").parentNode.classList.remove("has-error");
        document.getElementById("register-password").parentNode.classList.remove("has-error");
        document.getElementById("register-password2").parentNode.classList.remove("has-error");
        document.getElementById("register-username-error").innerHTML = "";
        document.getElementById("register-email-error").innerHTML = "";
        document.getElementById("register-password-error").innerHTML = "";
        document.getElementById("register-password2-error").innerHTML = "";

        $.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/register.php`,
            data: `${$register.serialize()}&sport=${g.sport}`,
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: async data => {
                if (data.success) {
                    g.vm.topMenu.username(data.username);

                    await account.addAchievements(["participation"]);
                    ui.realtimeUpdate([], "/account");
                } else {
                    for (const error in data.errors) {
                        if (data.errors.hasOwnProperty(error)) {
                            if (error === "username") {
                                document.getElementById("register-username").parentNode.classList.add("has-error");
                                document.getElementById("register-username-error").innerHTML = data.errors[error];
                            } else if (error === "email") {
                                document.getElementById("register-email").parentNode.classList.add("has-error");
                                document.getElementById("register-email-error").innerHTML = data.errors[error];
                            } else if (error === "password") {
                                document.getElementById("register-password").parentNode.classList.add("has-error");
                                document.getElementById("register-password-error").innerHTML = data.errors[error];
                            } else if (error === "password2") {
                                document.getElementById("register-password2").parentNode.classList.add("has-error");
                                document.getElementById("register-password2-error").innerHTML = data.errors[error];
                            } else if (error === "passwords") {
                                document.getElementById("register-password").parentNode.classList.add("has-error");
                                document.getElementById("register-password2").parentNode.classList.add("has-error");
                                document.getElementById("register-password2-error").innerHTML = data.errors[error];
                            }
                        }
                    }
                }
            },
            error: () => {
                document.getElementById("register-error").innerHTML = ajaxErrorMsg;
            }
        });
    });
}

module.exports = bbgmView.init({
    id: "loginOrRegister",
    beforeReq: viewHelpers.beforeNonLeague,
    uiFirst
});
