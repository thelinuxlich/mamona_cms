define(['durandal/app','plugins/dialog','viewmodels/shell','durandal/system','./customModal'],function (app,dialog,shell,system,CustomModal) {
    return {
        email: ko.observable(""),
        password: ko.observable(""),
        title: app.title,
        forgotPassword: function() {
            CustomModal.show().then(function(response) {
                $.post("forgot_password",{email: response}).then(function(r){
                    if(r.status) {
                        dialog.showMessage("Um e-mail foi enviado, verifique sua caixa de entrada.");
                    } else {
                        dialog.showMessage("Ocorreu um erro ao tentar enviar um e-mail, cheque o endereço e tente novamente.");
                    }
                });
            });
        },
        submit: function() {
            var that = this;
            $.post("login",{email: that.email(),password: that.password()}).then(function(r){
                if(r.status) {
                    app.trigger("flash",{type: "success", msg: r.msg});
                    app.trigger("loadPermissions",r.permissions);
                    app.trigger("username",r.username);
                    shell.router.navigate("");
                } else {
                    app.trigger("flashNow",{type: "error", msg: r.msg});
                }
            });
        }
    };
});