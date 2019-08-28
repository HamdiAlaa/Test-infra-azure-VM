import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as az from './azureVM';
let _config = require('../config/_az_vm.json');
let main_config = require('../config/main_config.json');


/************ if it is azure infra********************/
if(main_config.isAzure && !main_config.isAws){
    const az_infra = new az.Vms();
}