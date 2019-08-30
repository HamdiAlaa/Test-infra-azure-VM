import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { Output, UnwrappedArray } from "@pulumi/pulumi";

let _config = require('../config/_az_vm.json');

export class Vms {
    
    //Declarations
    public connectionString: string;
    public ipAddressesListe: UnwrappedArray<string> = [];
    public ipAddress: Output<UnwrappedArray<string>>;


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
            var publicIp = new azure.network.PublicIp(`server-ip${index}`, {
                resourceGroupName,
                allocationMethod: "Dynamic",
            });

            var mainNetworkInterface = new azure.network.NetworkInterface(`main${index}`, {
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

            var mainVirtualMachine = new azure.compute.VirtualMachine(`VM-${index}`, {
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
            var done = pulumi.all({ _: mainVirtualMachine.id, name: publicIp.name, resourceGroupName: publicIp.resourceGroupName });
            this.ipAddress = done.apply(d => {
                const ip = azure.network.getPublicIP({ name: d.name, resourceGroupName: d.resourceGroupName });
                this.ipAddressesListe.push(ip.ipAddress);
                // this.ipAddressesListe.push(`192.168.1.${index}`);
                return pulumi.output(this.ipAddressesListe);
            });

        }//End Boucle

        //Create an Azure resource (Storage Account)
        const account = new azure.storage.Account("storage", {
            resourceGroupName: resourceGroup.name,
            accountTier: "Standard",
            accountReplicationType: "LRS",
        });
    }//End Constructor
}//End Class