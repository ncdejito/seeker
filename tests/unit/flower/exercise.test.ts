import { describe, it, expect, vi } from 'vitest'
import { FlowerExercise, FlowerAnswers } from '../../../src/flower/exercise'

describe('flower/exercise', () => {
  const defaultAnswers: FlowerAnswers = {
    part1: 'python developer with 5 years experience',
    part2: 'want to work on AI and machine learning projects',
    part3: 'prefer to work in london or remote',
    part4: 'like flexible working hours and independent work',
    part5: 'enjoy working in small teams',
    part6: 'salary above 50k and good benefits',
    part7: 'want to make an impact through technology'
  }

  it('should create filter criteria from answers', () => {
    const exercise = new FlowerExercise(defaultAnswers)
    const criteria = exercise.getFilterCriteria()

    expect(criteria.keywords).toBeDefined()
    expect(criteria.keywords.length).toBeGreaterThan(0)
    expect(criteria.location).toBe('london')
  })

  it('should extract location from part3', () => {
    const exercise = new FlowerExercise({
      ...defaultAnswers,
      part3: 'san francisco area'
    })
    const criteria = exercise.getFilterCriteria()
    expect(criteria.location).toBe('san francisco')
  })

  it('should extract working style from part4', () => {
    const exercise = new FlowerExercise({
      ...defaultAnswers,
      part4: 'prefer remote work and flexible schedule'
    })
    const criteria = exercise.getFilterCriteria()
    expect(criteria.workStyle).toBe('remote')
  })

  it('should extract people preference from part5', () => {
    const exercise = new FlowerExercise({
      ...defaultAnswers,
      part5: 'prefer to work in collaborative teams'
    })
    const criteria = exercise.getFilterCriteria()
    expect(criteria.peoplePreference).toBe('team-oriented')
  })

  it('should extract conditions from part6', () => {
    const exercise = new FlowerExercise({
      ...defaultAnswers,
      part6: 'looking for good salary and benefits package'
    })
    const criteria = exercise.getFilterCriteria()
    expect(criteria.conditions).toBe('salary')
  })

  it('should extract purpose from part7', () => {
    const exercise = new FlowerExercise({
      ...defaultAnswers,
      part7: 'want to make an impact with my work'
    })
    const criteria = exercise.getFilterCriteria()
    expect(criteria.purpose).toBe('impact')
  })

  it('should handle empty answers gracefully', () => {
    const exercise = new FlowerExercise({} as FlowerAnswers)
    const criteria = exercise.getFilterCriteria()
    expect(criteria.keywords).toEqual([])
  })
})