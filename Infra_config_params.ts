import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import { location } from "@pulumi/azure/config";

//liste of azure location
const location_l= ["EastUS","CentralUS","WestUS","SouthAfricaNorth"];
const vmSize_l = ["Standard_F1","Standard_F2","Standard_F1s","Standard_F2s"];

export class Infra_config_params{
    fOUNDED_LOCATION=false;
    config = new pulumi.Config();
    prefix:string;
    username:string;
    password:string;
    location:string;
    vmSize:string;
    constructor(){
        this.prefix = this.config.require("prefix");
        this.username = this.config.require("username");
        this.password = this.config.require("password");
        this.location = this.config.require("location");
        this.location = this.config.require("vmsize");
    }

    check_location(){
        location_l.forEach(element => {
            if(element==location) this.fOUNDED_LOCATION=true;
        });
        //It suppose to be an exception
        if(this.fOUNDED_LOCATION == false) 
        {
            console.log(location+"do not existe");
            this.location = "";

    };
    }
    thelog(){
        console.log("The params are "+this.prefix,this.username,this.password,this.location);
    }
}