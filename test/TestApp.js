import React from 'react';
import ReactDOM from 'react-dom';
import {ContentsSlider, ContentsSliderItem} from '../src/index.js';

class TestApp extends React.Component {
    handleImageLoad(event) {
        console.log('Image loaded ', event.target)
    }

    render() {
        const images = [
        {
            renderItem: () => {
                return (
                    <div className='image-gallery-image'>
                        <div style={{width:'100%', backgroundImage: 'url(http://lorempixel.com/1000/600/nature/1/)'}}>
                        dfvdfv
                        dfvdfvdfbdb
                        fn
                        fghn
                        gfhn
                        ghn
                        ghnngsdh
                        var name = new type(arguments);
                        </div>
                    </div>
                );
            }
        },
        {
            original: 'http://lorempixel.com/1000/600/nature/2/',
            thumbnail: 'http://lorempixel.com/250/150/nature/2/'
        },
        {
            original: 'http://lorempixel.com/1000/600/nature/3/',
            thumbnail: 'http://lorempixel.com/250/150/nature/3/'
        }
        ]

        return (
            <div style={{margin: 50}}>
            <ContentsSlider
                ref={i => this._imageGallery = i}
                slideInterval={2000}
                onImageLoad={this.handleImageLoad}>
                <ContentsSliderItem 
                    height={600} 
                    backgroundImage='url(https://a0.muscache.com/airbnb/static/engagement/p1/large/posters_sm.jpg)'>
                    test!
                </ContentsSliderItem>
                <ContentsSliderItem 
                    height={600} 
                    backgroundImage='url(https://a0.muscache.com/airbnb/static/engagement/p1/large/experiences-hero-desktop.png)'
                    background='linear-gradient(120deg, #ff7e75, #ff9988, #a91f56)'>
                    test@
                </ContentsSliderItem>
                <ContentsSliderItem 
                    height={600} 
                    backgroundImage='url(https://a0.muscache.com/airbnb/static/engagement/p1/large/places_desktop_lg.png)'
                    background='linear-gradient(135deg, #ffefd3 0%, #fcdece 53%, #fdab93 100%)'>
                    test@
                </ContentsSliderItem>
                <ContentsSliderItem 
                    height={600} 
                    backgroundImage='url(https://a0.muscache.com/airbnb/static/engagement/p1/large/keynote_desktop.jpg)'
                    background='linear-gradient(190deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.1) 100%)'>
                    test@
                </ContentsSliderItem>
            </ContentsSlider>
            </div>
        );
    }
}

const rootElement = document.getElementById('root');    
ReactDOM.render(<TestApp />, rootElement);
