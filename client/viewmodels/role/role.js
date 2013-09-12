define(function(){
    var Role = function() {
        this.id = "";
        this.name = ko.observable();
        this.description = ko.observable();
    };

    return Role;
});