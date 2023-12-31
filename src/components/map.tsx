import React from 'react';
import * as d3 from "d3";

import velovData from "../content/velovhistorique.json";
import velovPosition from "../content/velovPosition.json";

interface VelovMapComponentProps{

}

class VelovMapComponent extends React.Component<VelovMapComponentProps, {}>{
    initMap(lon:any, lat:any, data, position) {
        let JSONPosition = JSON.stringify(position);
        let node = document.createElement("div")
        d3.geoConicConformal().center([4.850000, 45.750000]).scale(2800);
        d3.select(node)
          .attr("width", 640)
          .attr("height", 480);

        d3.json(JSON.stringify(position)).then((dataResult)=>{
            console.log("ok");
        }).catch(err=>{
            console.error(err);
        })
    }

    componentDidMount(): void {
        this.initMap(0,0,velovData.values, velovPosition)
    }

    render(){
        return "ok";
    }
}

export default VelovMapComponent;