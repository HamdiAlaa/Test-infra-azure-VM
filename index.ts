import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
// import {Infra_config_params} from "./Infra_config_params" ;

let _config = require('../config/_az_vm.json');
//Create an Azure Resource Group
const resourceGroup = new azure.core.ResourceGroup("resourceGroup", {
    location: _config.location,
});


//NetWork
const mainVirtualNetwork = new azure.network.VirtualNetwork("main",{
    addressSpaces :["10.0.0.0/16"],
    location: resourceGroup.location,
    name: `${_config.prefix}-network`,
    resourceGroupName: resourceGroup.name,
});

//Subnet
const internal = new azure.network.Subnet("internal",{
    addressPrefix:"10.0.2.0/24",
    name:"internal",
    resourceGroupName:resourceGroup.name,
    virtualNetworkName:mainVirtualNetwork.name

});

// main interface
for (let index = 1; index <= _config.vmNumber; index++) {
const mainNetworkInterface = new azure.network.NetworkInterface(`main${index}`, {
    ipConfigurations: [{
        name: `testconfiguration${index}`,
        privateIpAddressAllocation: "Dynamic",
        subnetId: internal.id,
    }],
    location: resourceGroup.location,
    name: `${_config.prefix}-nic-${index}`,
    resourceGroupName: resourceGroup.name,
});

//Create the virtual machine 

const mainVirtualMachine = new azure.compute.VirtualMachine(`VM-${index}`, {
    location: resourceGroup.location,
    name: `${_config.prefix}-vm-${index}`,
    networkInterfaceIds: [mainNetworkInterface.id],
    osProfile: {
        adminPassword: _config.password,
        adminUsername: _config.username,
        computerName: `hostname${index}`,
    },
    osProfileLinuxConfig: {
        disablePasswordAuthentication: false,
    },
    resourceGroupName: resourceGroup.name,
    storageImageReference: {
        offer: "UbuntuServer",
        publisher: "Canonical",
        sku: "16.04-LTS",
        version: "latest",
    },
    storageOsDisk: {
        caching: "ReadWrite",
        createOption: "FromImage",
        managedDiskType: "Standard_LRS",
        name: `mytestosdisk${index}`,
    },
    tags: {
        environment: "staging",
    },
    vmSize: _config.vmsize,
});
}
//Create an Azure resource (Storage Account)
const account = new azure.storage.Account("storage", {
    resourceGroupName: resourceGroup.name,
    accountTier: "Standard",
    accountReplicationType: "LRS",
});
// Export the connection string for the storage account
export const connectionString = account.primaryConnectionString;

