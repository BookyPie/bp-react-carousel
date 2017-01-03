import React from 'react';
import Swipeable from 'react-swipeable';
import throttle from 'lodash.throttle';

import './scss/image-gallery.scss';

const MIN_INTERVAL = 500;
const screenChangeEvents = [
  'fullscreenchange',
  'msfullscreenchange',
  'mozfullscreenchange',
  'webkitfullscreenchange'
];

export default class ContentsSlider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentIndex: props.startIndex,
            offsetPercentage: 0,
            galleryWidth: 0,
            isFullscreen: false,
            isPlaying: false
        };
    }

    static propTypes = {
        showNav: React.PropTypes.bool,
        autoPlay: React.PropTypes.bool,
        lazyLoad: React.PropTypes.bool,
        infinite: React.PropTypes.bool,
        showIndex: React.PropTypes.bool,
        showBullets: React.PropTypes.bool,
        showPlayButton: React.PropTypes.bool,
        showFullscreenButton: React.PropTypes.bool,
        disableArrowKeys: React.PropTypes.bool,
        disableSwipe: React.PropTypes.bool,
        defaultImage: React.PropTypes.string,
        indexSeparator: React.PropTypes.string,
        startIndex: React.PropTypes.number,
        slideInterval: React.PropTypes.number,
        onSlide: React.PropTypes.func,
        onScreenChange: React.PropTypes.func,
        onPause: React.PropTypes.func,
        onPlay: React.PropTypes.func,
        onClick: React.PropTypes.func,
        onImageLoad: React.PropTypes.func,
        onImageError: React.PropTypes.func,
        renderCustomControls: React.PropTypes.func,
        renderItem: React.PropTypes.func
    };

    static defaultProps = {
        showNav: true,
        autoPlay: false,
        lazyLoad: false,
        infinite: true,
        showIndex: false,
        showBullets: true,
        showPlayButton: false,
        showFullscreenButton: false,
        disableArrowKeys: false,
        disableSwipe: false,
        indexSeparator: ' / ',
        startIndex: 0,
        slideInterval: 3000
    };

    componentWillReceiveProps(nextProps) {
        if (this.props.disableArrowKeys !== nextProps.disableArrowKeys) {
            if (nextProps.disableArrowKeys) {
                window.removeEventListener('keydown', this._handleKeyDown);
            } else {
                window.addEventListener('keydown', this._handleKeyDown);
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.currentIndex !== this.state.currentIndex) {
            if (this.props.onSlide) {
                this.props.onSlide(this.state.currentIndex);
            }
        }
    }

    componentWillMount() {
        this._slideLeft = throttle(this._slideLeft.bind(this), MIN_INTERVAL, true);
        this._slideRight = throttle(this._slideRight.bind(this), MIN_INTERVAL, true);
        this._handleResize = this._handleResize.bind(this);
        this._handleScreenChange = this._handleScreenChange.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
    }

    componentDidMount() {
        // delay initial resize to get the accurate this._imageGallery.offsetWidth
        window.setTimeout(() => this._handleResize(), 500);

        if (this.props.autoPlay) {
            this.play();
        }
        if (!this.props.disableArrowKeys) {
            window.addEventListener('keydown', this._handleKeyDown);
        }
        window.addEventListener('resize', this._handleResize);
        this._onScreenChangeEvent();
    }

    componentWillUnmount() {
        if (!this.props.disableArrowKeys) {
            window.removeEventListener('keydown', this._handleKeyDown);
        }
        window.removeEventListener('resize', this._handleResize);
        this._offScreenChangeEvent();

        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    play(callback = true) {
        if (!this._intervalId) {
            this.setState({isPlaying: true});
            const {slideInterval} = this.props;
            this._intervalId = window.setInterval(() => {
                if (!this.state.hovering) {
                    if (!this.props.infinite && !this._canSlideRight()) {
                        this.pause();
                    } else {
                        this.slideToIndex(this.state.currentIndex + 1);
                    }
                }
            }, slideInterval > MIN_INTERVAL ? slideInterval : MIN_INTERVAL);

            if (this.props.onPlay && callback) {
                this.props.onPlay(this.state.currentIndex);
            }
        }
    }

    pause(callback = true) {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
            this.setState({isPlaying: false});
            if (this.props.onPause && callback) {
                this.props.onPause(this.state.currentIndex);
            }
        }
    }

    fullScreen() {
        const gallery = this._imageGallery;
        if (gallery.requestFullscreen) {
            gallery.requestFullscreen();
        } else if (gallery.msRequestFullscreen) {
            gallery.msRequestFullscreen();
        } else if (gallery.mozRequestFullScreen) {
            gallery.mozRequestFullScreen();
        } else if (gallery.webkitRequestFullscreen) {
            gallery.webkitRequestFullscreen();
        } else {
            // fallback to fullscreen modal for unsupported browsers
            this.setState({modalFullscreen: true});
            // manually call because browser does not support screenchange events
            if (this.props.onScreenChange) {
                this.props.onScreenChange(true);
            }
        }
        this.setState({isFullscreen: true});
    }

    exitFullScreen() {
        if (this.state.isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else {
                // fallback to fullscreen modal for unsupported browsers
                this.setState({modalFullscreen: false});
                // manually call because browser does not support screenchange events
                if (this.props.onScreenChange) {
                    this.props.onScreenChange(false);
                }
            }
            this.setState({isFullscreen: false});
        }
    }

    slideToIndex(index, event) {
        if (event) {
            if (this._intervalId) {
                // user triggered event while ImageGallery is playing, reset interval
                this.pause(false);
                this.play(false);
            }
        }

        let slideCount = React.Children.count(this.props.children) - 1;
        let currentIndex = index;

        if (index < 0) {
            currentIndex = slideCount;
        } else if (index > slideCount) {
            currentIndex = 0;
        }

        this.setState({
            previousIndex: this.state.currentIndex,
            currentIndex: currentIndex,
            offsetPercentage: 0,
            style: {
                transition: 'transform .45s ease-out'
            }
        });
    }

    getCurrentIndex() {
        return this.state.currentIndex;
    }

    _handleScreenChange() {
        /*
        handles screen change events that the browser triggers e.g. esc key
        */
        const fullScreenElement = document.fullscreenElement ||
        document.msFullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement;

        if (this.props.onScreenChange) {
            this.props.onScreenChange(fullScreenElement);
        }

        this.setState({isFullscreen: !!fullScreenElement});
    }

    _onScreenChangeEvent() {
        screenChangeEvents.map(eventName => {
            document.addEventListener(eventName, this._handleScreenChange);
        });
    }

    _offScreenChangeEvent() {
        screenChangeEvents.map(eventName => {
            document.removeEventListener(eventName, this._handleScreenChange);
        });
    }

    _toggleFullScreen() {
        if (this.state.isFullscreen) {
            this.exitFullScreen();
        } else {
            this.fullScreen();
        }
    }

    _togglePlay() {
        if (this._intervalId) {
            this.pause();
        } else {
            this.play();
        }
    }

    _handleResize() {
        if (this._imageGallery) {
            this.setState({galleryWidth: this._imageGallery.offsetWidth});
        }
    }

    _handleKeyDown(event) {
        const LEFT_ARROW = 37;
        const RIGHT_ARROW = 39;
        const key = parseInt(event.keyCode || event.which || 0);

        switch(key) {
            case LEFT_ARROW:
                if (this._canSlideLeft() && !this._intervalId) {
                    this._slideLeft();
                }
                break;
            case RIGHT_ARROW:
                if (this._canSlideRight() && !this._intervalId) {
                    this._slideRight();
                }
                break;
        }
    }

    _handleImageError(event) {
        if (this.props.defaultImage &&
            event.target.src.indexOf(this.props.defaultImage) === -1) {
            event.target.src = this.props.defaultImage;
        }
    }

    _handleOnSwiped(ev, x, y, isFlick) {
        this.setState({isFlick: isFlick});
    }

    _shouldSlideOnSwipe() {
        const shouldSlide = Math.abs(this.state.offsetPercentage) > 30 ||
        this.state.isFlick;

        if (shouldSlide) {
            // reset isFlick state after so data is not persisted
            this.setState({isFlick: false});
        }
        return shouldSlide;
    }

    _handleOnSwipedTo(index) {
        let slideTo = this.state.currentIndex;

        if (this._shouldSlideOnSwipe()) {
            slideTo += index;
        }

        if (index < 0) {
            if (!this._canSlideLeft()) {
                slideTo = this.state.currentIndex;
            }
        } else {
            if (!this._canSlideRight()) {
                slideTo = this.state.currentIndex;
            }
        }
        this.slideToIndex(slideTo);
    }

    _handleSwiping(index, _, delta) {
        const offsetPercentage = index * (delta / this.state.galleryWidth * 100);
        this.setState({offsetPercentage: offsetPercentage, style: {}});
    }

    _canNavigate() {
        return React.Children.count(this.props.children) >= 2;
    }

    _canSlideLeft() {
        return this.props.infinite || this.state.currentIndex > 0;
    }

    _canSlideRight() {
        return this.props.infinite ||
        this.state.currentIndex < React.Children.count(this.props.children) - 1;
    }

    _getAlignmentClassName(index) {
        // LEFT, and RIGHT alignments are necessary for lazyLoad
        let {currentIndex} = this.state;
        let alignment = '';
        const LEFT = 'left';
        const CENTER = 'center';
        const RIGHT = 'right';

        switch (index) {
            case (currentIndex - 1):
                alignment = ` ${LEFT}`;
                break;
            case (currentIndex):
                alignment = ` ${CENTER}`;
                break;
            case (currentIndex + 1):
                alignment = ` ${RIGHT}`;
                break;
        }

        if (React.Children.count(this.props.children) >= 3 && this.props.infinite) {
            if (index === 0 && currentIndex === React.Children.count(this.props.children) - 1) {
                // set first slide as right slide if were sliding right from last slide
                alignment = ` ${RIGHT}`;
            } else if (index === React.Children.count(this.props.children) - 1 && currentIndex === 0) {
                // set last slide as left slide if were sliding left from first slide
                alignment = ` ${LEFT}`;
            }
        }

        return alignment;
    }

    _getTranslateXForTwoSlide(index) {
        // For taking care of infinite swipe when there are only two slides
        const {currentIndex, offsetPercentage, previousIndex} = this.state;
        const baseTranslateX = -100 * currentIndex;
        let translateX = baseTranslateX + (index * 100) + offsetPercentage;

        // keep track of user swiping direction
        if (offsetPercentage > 0) {
            this.direction = 'left';
        } else if (offsetPercentage < 0) {
            this.direction = 'right';
        }

        // when swiping make sure the slides are on the correct side
        if (currentIndex === 0 && index === 1 && offsetPercentage > 0) {
            translateX = -100 + offsetPercentage;
        } else if (currentIndex === 1 && index === 0 && offsetPercentage < 0) {
            translateX = 100 + offsetPercentage;
        }

        if (currentIndex !== previousIndex) {
            // when swiped move the slide to the correct side
            if (previousIndex === 0 && index === 0 &&
                offsetPercentage === 0 && this.direction === 'left') {
                translateX = 100;
            } else if (previousIndex === 1 && index === 1 &&
                offsetPercentage === 0 && this.direction === 'right') {
                translateX = -100;
            }
        } else {
            // keep the slide on the correct slide even when not a swipe
            if (currentIndex === 0 && index === 1 &&
                offsetPercentage === 0 && this.direction === 'left') {
                translateX = -100;
            } else if (currentIndex === 1 && index === 0 &&
                offsetPercentage === 0 && this.direction === 'right') {
                translateX = 100;
            }
        }

        return translateX;
    }

    _getSlideStyle(index) {
        const {currentIndex, offsetPercentage} = this.state;
        const {infinite} = this.props;
        const baseTranslateX = -100 * currentIndex;
        const totalSlides = React.Children.count(this.props.children) - 1;

        // calculates where the other slides belong based on currentIndex
        let translateX = baseTranslateX + (index * 100) + offsetPercentage;

        // adjust zIndex so that only the current slide and the slide were going
        // to is at the top layer, this prevents transitions from flying in the
        // background when swiping before the first slide or beyond the last slide
        let zIndex = 1;
        if (index === currentIndex) {
            zIndex = 3;
        } else if (index === this.state.previousIndex) {
            zIndex = 2;
        }

        if (infinite && React.Children.count(this.props.children) > 2) {
            if (currentIndex === 0 && index === totalSlides) {
                // make the last slide the slide before the first
                translateX = -100 + offsetPercentage;
            } else if (currentIndex === totalSlides && index === 0) {
                // make the first slide the slide after the last
                translateX = 100 + offsetPercentage;
            }
        }

        // Special case when there are only 2 items with infinite on
        if (infinite && React.Children.count(this.props.children) === 2) {
            translateX = this._getTranslateXForTwoSlide(index);
        }

        const translate3d = `translate3d(${translateX}%, 0, 0)`;

        return {
            WebkitTransform: translate3d,
            MozTransform: translate3d,
            msTransform: translate3d,
            OTransform: translate3d,
            transform: translate3d,
            zIndex: zIndex
        };
    }

    _slideLeft(event) {
        this.slideToIndex(this.state.currentIndex - 1, event);
    }

    _slideRight(event) {
        this.slideToIndex(this.state.currentIndex + 1, event);
    }

    render() {
        const {
            currentIndex,
            isFullscreen,
            modalFullscreen,
            isPlaying
        } = this.state;

        const slideLeft = this._slideLeft.bind(this);
        const slideRight = this._slideRight.bind(this);

        let slides = [];
        let bullets = [];

        React.Children.map(this.props.children, (item, index) => {
            const alignment = this._getAlignmentClassName(index);

            const slide = (
                <div
                    key={index}
                    className={'image-gallery-slide' + alignment}
                    style={Object.assign(this._getSlideStyle(index), this.state.style)}
                    onClick={this.props.onClick}>
                    {item}
                </div>
            );

            if (this.props.lazyLoad) {
                if (alignment) {
                    slides.push(slide);
                }
            } else {
                slides.push(slide);
            }

            if (this.props.showBullets) {
                bullets.push(
                    <button
                        key={index}
                        type='button'
                        className={'image-gallery-bullet ' + (
                            currentIndex === index ? 'active' : '')}
                        onClick={event => this.slideToIndex.call(this, index, event)}>
                    </button>
                );
            }
        });

        return (
            <section
                ref={i => this._imageGallery = i}
                className={`image-gallery${modalFullscreen ? ' fullscreen-modal' : ''}`}>
                <div className={`image-gallery-content${isFullscreen ? ' fullscreen' : ''}`}>
                    <div className='image-gallery-slide-wrapper'>
                        {this.props.renderCustomControls && this.props.renderCustomControls()}
                        {
                            this.props.showFullscreenButton &&
                            <a
                                className={`image-gallery-fullscreen-button${isFullscreen ? ' active' : ''}`}
                                onClick={this._toggleFullScreen.bind(this)} />
                        }

                        {
                            this.props.showPlayButton &&
                            <a
                                ref={p => this._playButton = p}
                                className={`image-gallery-play-button${isPlaying ? ' active' : ''}`}
                                onClick={this._togglePlay.bind(this)} />
                        }

                        {
                            this._canNavigate() ?
                            [
                                this.props.showNav &&
                                <span key='navigation'>
                                    <button
                                        type='button'
                                        className='image-gallery-left-nav'
                                        disabled={!this._canSlideLeft()}
                                        onClick={slideLeft}/>
                                    <button
                                        type='button'
                                        className='image-gallery-right-nav'
                                        disabled={!this._canSlideRight()}
                                        onClick={slideRight}/>
                                </span>,
                                this.props.disableSwipe ?
                                <div className='image-gallery-slides' key='slides'>
                                    {slides}
                                </div>
                                :
                                <Swipeable
                                    className='image-gallery-swipe'
                                    key='swipeable'
                                    delta={1}
                                    onSwipingLeft={this._handleSwiping.bind(this, -1)}
                                    onSwipingRight={this._handleSwiping.bind(this, 1)}
                                    onSwiped={this._handleOnSwiped.bind(this)}
                                    onSwipedLeft={this._handleOnSwipedTo.bind(this, 1)}
                                    onSwipedRight={this._handleOnSwipedTo.bind(this, -1)}>
                                    <div className='image-gallery-slides'>
                                        {slides}
                                    </div>
                                </Swipeable>
                            ]
                            :
                            <div className='image-gallery-slides'>
                                {slides}
                            </div>
                        }
                        {
                            this.props.showBullets &&
                            <div className='image-gallery-bullets'>
                                <ul className='image-gallery-bullets-container'>
                                    {bullets}
                                </ul>
                            </div>
                        }
                        {
                            this.props.showIndex &&
                            <div className='image-gallery-index'>
                                <span className='image-gallery-index-current'>
                                    {this.state.currentIndex + 1}
                                </span>
                                <span className='image-gallery-index-separator'>
                                    {this.props.indexSeparator}
                                </span>
                                <span className='image-gallery-index-total'>
                                    {React.Children.count(this.props.children)}
                                </span>
                            </div>
                        }
                    </div>

                </div>

            </section>
        );
    }
};