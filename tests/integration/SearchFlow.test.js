import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchBar from '../../src/components/SearchBar.vue'
import POICard from '../../src/components/POICard.vue'
import ResultsList from '../../src/components/ResultsList.vue'

describe('Search Flow Integration', () => {
  describe('SearchBar Component', () => {
    const defaultProps = {
      categories: [
        { key: 'restaurant', label: 'Restaurants', icon: '🍽️' },
        { key: 'hotel', label: 'Hotels', icon: '🏨' }
      ],
      isLoading: false
    }

    it('should emit search event with query and category', async () => {
      const wrapper = mount(SearchBar, { props: defaultProps })

      const input = wrapper.find('.search-input')
      await input.setValue('coffee')

      const select = wrapper.find('.category-select')
      await select.setValue('restaurant')

      const button = wrapper.find('.search-btn')
      await button.trigger('click')

      expect(wrapper.emitted('search')).toBeTruthy()
      expect(wrapper.emitted('search')[0]).toEqual(['coffee', 'restaurant'])
    })

    it('should emit search on Enter key', async () => {
      const wrapper = mount(SearchBar, { props: defaultProps })

      const input = wrapper.find('.search-input')
      await input.setValue('hotel berlin')
      await input.trigger('keyup.enter')

      expect(wrapper.emitted('search')).toBeTruthy()
      expect(wrapper.emitted('search')[0]).toEqual(['hotel berlin', ''])
    })

    it('should disable search button when loading', () => {
      const wrapper = mount(SearchBar, {
        props: { ...defaultProps, isLoading: true }
      })

      const button = wrapper.find('.search-btn')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should disable search button when query is empty', () => {
      const wrapper = mount(SearchBar, { props: defaultProps })

      const button = wrapper.find('.search-btn')
      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should show clear button only when query exists', async () => {
      const wrapper = mount(SearchBar, { props: defaultProps })

      expect(wrapper.find('.clear-btn').exists()).toBe(false)

      await wrapper.find('.search-input').setValue('test')

      expect(wrapper.find('.clear-btn').exists()).toBe(true)
    })

    it('should emit clear and reset input when clear is clicked', async () => {
      const wrapper = mount(SearchBar, { props: defaultProps })

      const input = wrapper.find('.search-input')
      await input.setValue('test')

      await wrapper.find('.clear-btn').trigger('click')

      expect(wrapper.emitted('clear')).toBeTruthy()
      expect(input.element.value).toBe('')
    })

    it('should render categories in correct order', () => {
      const wrapper = mount(SearchBar, { props: defaultProps })

      const options = wrapper.findAll('.category-select option')

      // First option is "All Categories"
      expect(options[0].text()).toBe('All Categories')
      expect(options[1].text()).toContain('Restaurants')
      expect(options[2].text()).toContain('Hotels')
    })
  })

  describe('POICard Component', () => {
    const mockPOI = {
      id: 1,
      name: 'Test Restaurant',
      address: 'Main Street 1, Berlin, Germany',
      icon: '🍽️',
      categoryLabel: 'Restaurants',
      type: 'restaurant'
    }

    it('should render POI information correctly', () => {
      const wrapper = mount(POICard, {
        props: { poi: mockPOI, isSelected: false }
      })

      expect(wrapper.text()).toContain('Test Restaurant')
      expect(wrapper.text()).toContain('Main Street 1, Berlin, Germany')
      expect(wrapper.text()).toContain('Restaurants')
      expect(wrapper.text()).toContain('🍽️')
    })

    it('should emit select event on click', async () => {
      const wrapper = mount(POICard, {
        props: { poi: mockPOI, isSelected: false }
      })

      await wrapper.trigger('click')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0]).toEqual([mockPOI])
    })

    it('should have selected class when isSelected is true', () => {
      const wrapper = mount(POICard, {
        props: { poi: mockPOI, isSelected: true }
      })

      expect(wrapper.classes()).toContain('selected')
    })
  })

  describe('ResultsList Component', () => {
    const mockResults = [
      {
        id: 1,
        name: 'Restaurant A',
        address: 'Address A',
        icon: '🍽️',
        categoryLabel: 'Restaurants'
      },
      {
        id: 2,
        name: 'Restaurant B',
        address: 'Address B',
        icon: '🍽️',
        categoryLabel: 'Restaurants'
      }
    ]

    it('should show empty state when no results', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: [],
          isLoading: false,
          error: null,
          selectedPOI: null
        }
      })

      expect(wrapper.text()).toContain('Enter a search term to find places')
    })

    it('should show loading state', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: [],
          isLoading: true,
          error: null,
          selectedPOI: null
        }
      })

      expect(wrapper.text()).toContain('Searching for places')
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })

    it('should show error message', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: [],
          isLoading: false,
          error: 'No results found',
          selectedPOI: null
        }
      })

      expect(wrapper.text()).toContain('No results found')
    })

    it('should render list of POI cards', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: mockResults,
          isLoading: false,
          error: null,
          selectedPOI: null
        }
      })

      const cards = wrapper.findAllComponents(POICard)
      expect(cards).toHaveLength(2)
    })

    it('should emit select when POI card is clicked', async () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: mockResults,
          isLoading: false,
          error: null,
          selectedPOI: null
        }
      })

      const firstCard = wrapper.findComponent(POICard)
      await firstCard.trigger('click')

      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')[0][0].id).toBe(1)
    })

    it('should show result count', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: mockResults,
          isLoading: false,
          error: null,
          selectedPOI: null
        }
      })

      expect(wrapper.text()).toContain('2 Results')
    })

    it('should show clear button when results exist', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: mockResults,
          isLoading: false,
          error: null,
          selectedPOI: null
        }
      })

      expect(wrapper.find('.clear-results-btn').exists()).toBe(true)
    })

    it('should mark selected POI card', () => {
      const wrapper = mount(ResultsList, {
        props: {
          results: mockResults,
          isLoading: false,
          error: null,
          selectedPOI: mockResults[0]
        }
      })

      const cards = wrapper.findAllComponents(POICard)
      expect(cards[0].props('isSelected')).toBe(true)
      expect(cards[1].props('isSelected')).toBe(false)
    })
  })
})
