import React from 'react';
import Text from '../Text/Text.js';

export default class Header extends React.Component{
    constructor() {
        super();
        this.state = {

        }
    }
    initButton(){
        let item = [];
        if(this.props.button == "true"){
            item.push(
                <div key="image">
                    <a className="driver_dashboard_button button_selected" href="http://ec2-52-58-27-100.eu-central-1.compute.amazonaws.com/secure/login/?method=logout">LOGOUT</a>
                </div>
            );
        }

        return item;
    }
    render() {
        return (
            <div className="driver_header">
                <div className="header_img">
                    <img src="../../images/icon_ericsson-01.svg"/>
                </div>
                <div className="driver_header_content">
                    {/*<div>
                        <img src="../../images/F2808482.jpg"/>
                    </div>*/}
                    <div className="driver_header_content_1">
                        <div>Welcome {this.props.content}</div>
                        {/*<div>Phone: {this.props.phone}</div>*/}
                    </div>
                    {this.initButton()}
                </div>
                <div>
                    {this.props.children}
                </div>
            </div>
        )
    }
}