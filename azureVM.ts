import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { Output, UnwrappedArray,Unwrap, output } from "@pulumi/pulumi";
import { AzureEnvironment } from "ms-rest-azure";

let _config = require('../config/_az_vm.json');

export class Vms {
    
    //Declarations
    public connectionString: string;
    public ipAddressesList: Output<string>[] = [];
    public dnsOutputArray: Output<string>[] = [];


    constructor() {
        //Create an Azure Resource Group
        const resourceGroup = new azure.core.ResourceGroup("resourceGroup", {
            location: _config.location,
        });
        const resourceGroupName = resourceGroup.name;
        //NetWork
        const mainVirtualNetwork = new azure.network.VirtualNetwork("main", {
            addressSpaces: ["10.0.0.0/16"],
            location: resourceGroup.location,
            name: `${_config.prefix}-network`,
            resourceGroupName: resourceGroup.name,
        });

        //Subnet
        const internal = new azure.network.Subnet("internal", {
            addressPrefix: "10.0.2.0/24",
            name: "internal",
            resourceGroupName: resourceGroup.name,
            virtualNetworkName: mainVirtualNetwork.name

        });



        // main interface
        for (let index = 1; index <= _config.vmNumber; index++) {

            // Now allocate a public IP and assign it to our NIC.
            const publicIp = new azure.network.PublicIp(`serverIp${index}`, {
                resourceGroupName,
                allocationMethod: "Dynamic",
                domainNameLabel:`vm-azure-dns${index}`,
            });

            const mainNetworkInterface = new azure.network.NetworkInterface(`main${index}`, {
                ipConfigurations: [{
                    name: `testconfiguration${index}`,
                    privateIpAddressAllocation: "Dynamic",
                    subnetId: internal.id,
                    publicIpAddressId: publicIp.id
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
                deleteDataDisksOnTermination: true,
                deleteOsDiskOnTermination: true,
                osProfileLinuxConfig: {
                    disablePasswordAuthentication: false,
                },
                resourceGroupName: resourceGroup.name,
                storageImageReference: {
                    offer: _config.offer,
                    publisher: "Canonical",
                    sku: _config.sku,
                    version: _config.version,
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

            
            // The public IP address is not allocated until the VM is running, so wait for that
            // resource to create, and then lookup the IP address again to report its public IP.
            const done = pulumi.all({ _: mainVirtualMachine.id, name: publicIp.name, resourceGroupName: publicIp.resourceGroupName });
            const ipAddres = done.apply(d => {
                return pulumi.output(azure.network.getPublicIP({ name: d.name, resourceGroupName: d.resourceGroupName }).ipAddress);
            });
            this.ipAddressesList.push(ipAddres);
            const dns = done.apply(d=>{
                return pulumi.output(azure.network.getPublicIP({ name: d.name, resourceGroupName: d.resourceGroupName }).domainNameLabel+'.eastus.cloudapp.azure.com');
            });
            this.dnsOutputArray.push(dns);

        }//End Boucle

        //Create an Azure resource (Storage Account)
        const account = new azure.storage.Account("storage", {
            resourceGroupName: resourceGroup.name,
            accountTier: "Standard",
            accountReplicationType: "LRS",
        });
    }//End Constructor
}//End Class
