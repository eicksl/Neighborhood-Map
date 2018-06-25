import React, {Component} from 'react'
import PropTypes from 'prop-types'
//import escapeRegExp from 'escape-string-regexp'


class ResultsList extends Component {
  static propTypes = {
    results: PropTypes.array.isRequired,
    activeVenue: PropTypes.number,
    toggleActive: PropTypes.func.isRequired
  }


  render() {
    const {activeVenue, toggleActive} = this.props
    return (
      <ul className='list-group'>
        {
          this.props.results.map((venue, i) => {
            let str
            if (i === activeVenue) {str = 'list-group-item active'}
            else {str = 'list-group-item'}
            return (
              <li key={i} className={str} onClick={() => toggleActive(venue.index)}>
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
