define(['durandal/app','viewmodels/table/index'],
function (app,Table) {
    this.table = "";
    return {
        table: this.table,
        viewAttached: function() {
            Table.initializeTable("users");
        },
        activate: function() {
            var that = this;
            return $.get("user").then(function(r){
                var table = new Table(r,{'#': 'id','Nome': 'name','E-mail': 'email',
                'Nível': 'role_name','Último Login': 'last_login_at',
                'Data de Criação': 'created_at','Status': 'status'});
                that.table = table.html;
            });
        }
    };
});