define(['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        attached: function() {
            Table.initializeTable("user");
        },
        activate: function() {
            var that = this;
            return $.get("user").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','E-mail': 'email',
                'Nível': 'role_name','Último Login': 'last_login_at',
                'Data de Criação': 'created_at','Status': 'status'},["Excluir"]);
                that.table = table.html;
            });
        }
    };
});