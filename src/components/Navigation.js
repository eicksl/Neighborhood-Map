import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import escapeRegExp from 'escape-string-regexp'
import sortBy from 'sort-by'
import ResultsList from './ResultsList.js'


class Navigation extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      filterValue: '',
      filteredResults: []
    }
  }


  static propTypes = {
    results: PropTypes.array.isRequired,
    navClassName: PropTypes.string.isRequired,
    activeVenue: PropTypes.number,
    toggleActive: PropTypes.func.isRequired
  }


  componentDidUpdate(prevProps) {
    if (this.props.results !== prevProps.results) {
      //copy results to prevent the original indeces from being modified
      const resultsCopy = [...this.props.results]
      this.setState({filteredResults: resultsCopy.sort(sortBy('name'))})
    }
  }


  updateFiltered = event => {
    this.setState({filterValue: event.target.value}, () => {
      const {filterValue} = this.state
      if (filterValue) {
        const match = new RegExp(escapeRegExp(filterValue), 'i')
        const newResults = this.props.results.filter(venue => match.test(venue.name))
        this.setState({
          filteredResults: newResults.sort(sortBy('name'))
        })
      } else {
        this.setState({filteredResults: this.props.results})
      }
    })
  }


  render() {
    const {activeVenue, toggleActive} = this.props
    return (
      <nav className={this.props.navClassName}>
        <div className='sidebar-wrapper'>

          <form>

            <div className='row-4'>
              <div className='form-group search-fields'>
                <label className='input-fields' htmlFor='location'>Location</label>
                <input
                  id='location' className='form-control form-control-md' type='text'
                  name='location' placeholder='Enter a city, address, or area'
                  data-bind='value: location'
                />
              </div>
            </div>

            <div className='row-4'>
              <div className='form-group search-fields'>
                <label className='input-fields' htmlFor='query'>Type of Venue</label>
                <input
                  id='query' className='form-control form-control-md' type='text'
                  name='query' placeholder="e.g. 'cafe', 'indian food'"
                />
              </div>
            </div>

            <div id='search-btn' className='col'>
              <button type='submit' className='btn btn-info'>Search Venues</button>
            </div>

          </form>

          <hr />

          <img id='img-icons' src={require('../img/icons.png')} alt='third party icons' />

          <input
            id='filter' className='form-control form-control-sm' type='text'
            placeholder='Filter Results' name='filter' onChange={this.updateFiltered}
          />

          <ResultsList results={this.state.filteredResults} activeVenue={activeVenue} toggleActive={toggleActive} />

        </div>
      </nav>
    )
  }
}


export default Navigation
