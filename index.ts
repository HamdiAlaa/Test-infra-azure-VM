import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as az from './azureVM';
let _config = require('../config/_az_vm.json');
let main_config = require('../config/main_config.json');


/************ if it is azure infra********************/
var az_infra:any;
if(main_config.isAzure && !main_config.isAws){
    az_infra = new az.Vms();
}
else if(!main_config.isAzure && main_config.isAws){}
export var ips = az_infra.ipAddresses;
// export var listeIp = pulumi.output(az_infra.ipAddressesListe);