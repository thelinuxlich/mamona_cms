define(['knockout'],function(ko){
    var User = function() {
        this.id = "";
        this.name = ko.observable();
        this.avatar = ko.observable();
        this.role_id = ko.observable();
        this.email = ko.observable();
        this.password = ko.observable();
        this.status = ko.observable(1);
    };

    return User;
});