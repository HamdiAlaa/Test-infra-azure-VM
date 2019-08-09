import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import {Infra_config_params} from "./Infra_config_params" ;

const infra_params = new Infra_config_params();
infra_params.thelog();
//Create an Azure Resource Group
const resourceGroup = new azure.core.ResourceGroup("resourceGroup", {
    location: infra_params.location,
});


//NetWork
const mainVirtualNetwork = new azure.network.VirtualNetwork("main",{
    addressSpaces :["10.0.0.0/16"],
    location: resourceGroup.location,
    name: `${infra_params.prefix}-network`,
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
const mainNetworkInterface = new azure.network.NetworkInterface("main", {
    ipConfigurations: [{
        name: "testconfiguration1",
        privateIpAddressAllocation: "Dynamic",
        subnetId: internal.id,
    }],
    location: resourceGroup.location,
    name: `${infra_params.prefix}-nic`,
    resourceGroupName: resourceGroup.name,
});

//Create the virtual machine 
const mainVirtualMachine = new azure.compute.VirtualMachine("main", {
    location: resourceGroup.location,
    name: `${infra_params.prefix}-vm`,
    networkInterfaceIds: [mainNetworkInterface.id],
    osProfile: {
        adminPassword: infra_params.password,
        adminUsername: infra_params.username,
        computerName: "hostname",
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
        name: "myosdisk1",
    },
    tags: {
        environment: "staging",
    },
    vmSize: infra_params.vmsize,
});

//Create an Azure resource (Storage Account)
const account = new azure.storage.Account("storage", {
    resourceGroupName: resourceGroup.name,
    accountTier: "Standard",
    accountReplicationType: "LRS",
});
// Export the connection string for the storage account
export const connectionString = account.primaryConnectionString;

