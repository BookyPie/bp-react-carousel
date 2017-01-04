import React from 'react';

export default class ContentsSliderItem extends React.Component {
    static propTypes = {
        height: React.PropTypes.number
    };

    static defaultProps = {
        height: 400
    };

    render() {
        return (
            <div style={{
                width: '100%', 
                height: this.props.height,
                background: this.props.background,
                }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: this.props.backgroundImage,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center'
                }}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}