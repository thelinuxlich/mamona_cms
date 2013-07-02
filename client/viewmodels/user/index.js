define(['knockout','durandal/app','viewmodels/table/index'],
function (ko,app,Table) {
    return {
        table: ko.observable(),
        attachedToParent: function() {
            Table.initializeTable("users");
        },
        activate: function() {
            var that = this;
            $.get("user").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','E-mail': 'email',
                'Nível': 'role_name','Último Login': 'last_login_at',
                'Data de Criação': 'created_at','Status': 'status'},["Excluir"]);
                that.table = table.html;
            });
        }
    };
});