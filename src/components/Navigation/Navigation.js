/**
 * Created by ebinhon on 3/22/2016.
 */
import React from 'react';
import AppInfoStore from '../../Store/AppInfoStore';
import { Link } from 'react-router';
import './Navigation.scss';
import connectToStores from 'alt-utils/lib/connectToStores';

@connectToStores
export default class Navigation extends React.Component {
    static propTypes = {
        //React.PropTypes.string.isRequired,
        //React.PropTypes.bool,
        //React.PropTypes.object,
        //React.PropTypes.oneOf(['value1', 'value2'])
        //reference to official URL: https://facebook.github.io/react/docs/reusable-components.html
        links:React.PropTypes.arrayOf(React.PropTypes.object).isRequired

    }

    static defaultProps = {
        //back link should be always put last
        links:[
            {
                name: "Create",
                path:"/create/",
                param:"fleetId"
            },
            {
                name: "Back",
                path:"/",
                param: ""
            }
        ]
    }

    static getStores() {
        // this will handle the listening/unlistening for you
        return [AppInfoStore];
    }

    static getPropsFromStores() {
        // this is the data that gets passed down as props
        // each key in the object returned by this function is added to the `this.props`
        let linkChanged = AppInfoStore.getState().linkChanged;
        return {
            linkChanged: linkChanged
        }
    }

    constructor() {
        super();
        this.state = {
            changed:false
        }
    }

    componentDidMount(){

    }

    renderLinks(){
        let links = this.props.links;
        let links_item = [];
        let image;
        let a_flag;
        for(let index in links){
            if(index == 0){
                if(this.state.homeImage){
                    image = this.state.homeImage;
                    a_flag = "navigate_selected";
                }else{
                    image = <img src="../Asset/images/icon_home-01.svg" />
                    a_flag = "";
                }
            }else if(index == 1){
                if(this.state.eventImage){
                    image = this.state.eventImage;
                    a_flag = "navigate_selected";
                }else{
                    image = <img src="../Asset/images/icon_event-01.svg" />
                    a_flag = "";
                }
            }else if(index == 2){
                if(this.state.vehicleImage){
                    image = this.state.vehicleImage;
                    a_flag = "navigate_selected";
                }else {
                    image = <img src="../Asset/images/icon_vehicle-01.svg"/>
                    a_flag = "";
                }
            }
            links_item.push(
                <li key={index}>
                    <Link key={index} className={a_flag} onClick={this.changeLinkImage.bind(this,index)} to={{ pathname: links[index].path + links[index].param }}>
                        {image}
                        {links[index].name}
                    </Link>
                </li>
            );
        }
        return links_item;
    }

    changeLinkImage(index){
        console.log(index);
        if(index == 0){
            this.setState({
                homeImage:<img src="../Asset/images/icon_home2-01.svg" />,
                eventImage:null,
                vehicleImage: null
            });
        }else if(index == 1){
            this.setState({
                homeImage:null,
                eventImage:<img src="../Asset/images/icon_event2-01.svg" />,
                vehicleImage: null
            });
        }else if(index == 2){
            this.setState({
                homeImage:null,
                eventImage:null,
                vehicleImage:<img src="../Asset/images/icon_vehicle2-01.svg" />
            });
        }

    }

    render() {
        return(
            <ul>
                {this.renderLinks()}
            </ul>
        );
    }
}