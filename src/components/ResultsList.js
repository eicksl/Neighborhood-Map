import React, {Component} from 'react'
import PropTypes from 'prop-types'


class ResultsList extends Component {
  constructor(props) {
    super(props)
    this.lastFocusedElem = null

    document.addEventListener('keydown', event => {
      const activeElem = document.activeElement
      const focusLocation = () => {
        event.preventDefault()
        document.getElementById('location').focus()
      }
      if (event.keyCode === 9) {
        const listElems = document.querySelectorAll('.list-group-item')
        const lastListElem = listElems[listElems.length-1]
        /*
          If the active element is either the last list item in the results or
          any element outside of the nav sidebar, return focus to the first
          focusable element in the sidebar UNLESS the active element is the
          heading of the info-window in which case focus should be sent to
          either the next or previous element in the unordered list depending
          on whether the shift key is pressed
        */
        if ( activeElem === lastListElem
        || !['INPUT', 'BUTTON', 'LI'].includes(activeElem.tagName) ) {
          if (activeElem.className !== 'iw-name') {
            focusLocation()
          } else {  // heading of infoWindow is focused
            if (this.props.navClassName.includes('collapsed')) {
              this.props.toggleNavClassName()
            }
            if ( (this.lastFocusedElem === lastListElem && !event.shiftKey)
            || this.lastFocusedElem === null ) {
              focusLocation()
            } else {
              this.lastFocusedElem.focus()
            }
            document.querySelector('.iw-name').tabIndex = '-1'
          }
        }
        this.lastFocusedElem = activeElem
      }
      /*
        When pressing ENTER while focused on a results list element, the click
        event for that element should be triggered and focus should be moved
        to the heading of the resultant info-window
      */

      else if (event.keyCode === 13 && activeElem.className.includes('list-group-item')) {
        this.lastFocusedElem = activeElem
        activeElem.click()
      }
    })
  }


  static propTypes = {
    results: PropTypes.array.isRequired,
    activeVenue: PropTypes.number,
    toggleActive: PropTypes.func.isRequired,
    navClassName: PropTypes.string.isRequired,
    toggleNavClassName: PropTypes.func.isRequired
  }


  render() {
    const {activeVenue, toggleActive} = this.props
    return (
      <ul className='list-group'>
        {
          this.props.results.map((venue, i) => {
            let str
            if (venue.index === activeVenue) {str = 'list-group-item active'}
            else {str = 'list-group-item'}
            return (
              <li key={i} className={str} onClick={() => toggleActive(venue.index)} tabIndex='0'>
                {venue.name}
              </li>
            )
          })
        }
      </ul>
    )
  }
}


export default ResultsList
