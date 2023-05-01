import { Inter } from 'next/font/google'
import clsx from 'clsx'
import React, { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-regular-svg-icons'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

type SquareState = null | 'yellow' | 'green'
export default function Home() {
  const [letters, setLetters] = useState<(string | null)[][]>([
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ])

  const [squares, setSquares] = useState<SquareState[][]>([
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ])

  const [allWords, setAllWords] = useState<string[]>([])

  const loadWords = async () => {
    const res = await fetch('/sorted_words.txt')
    const text = await res.text()
    const words = text.split('\n')
    setAllWords(words)
  }

  const lettersWithState = (col: number, state: string | null) => {
    return letters
      .filter(row => row.every(letter => letter !== null && letter !== ''))
      .map((row, rowIndex) => [row[col], col, rowIndex])
      .filter(([letter]) => letter !== null && letter !== '')
      .filter(([, col, row]) => squares[row as number][col as number] === state)
      .map(([letter]) => letter as string)
  }

  const grayLetters = (col: number) => lettersWithState(col, null)
  const allGrayLetters = () => [...grayLetters(0), ...grayLetters(1), ...grayLetters(2), ...grayLetters(3), ...grayLetters(4)]
  const greenLetter = (col: number) => lettersWithState(col, 'green')[0] || ''
  const yellowLetters = (col: number) => lettersWithState(col, 'yellow')
  const allYellowLetters = () => [...yellowLetters(0), ...yellowLetters(1), ...yellowLetters(2), ...yellowLetters(3), ...yellowLetters(4)]

  const possibleWords = useMemo(() => {
    let words: string[] = allWords

    for (let i = 0; i < 5; i++) {
      if (greenLetter(i) !== '') {
        words = words.filter(word => word[i] === greenLetter(i))
      }

      if (yellowLetters(i).length !== 0) {
        words = words.filter(word => !yellowLetters(i).includes(word[i]))
      }

      if (grayLetters(i).length !== 0) {
        words = words.filter(word => !grayLetters(i).includes(word[i]))
      }
    }

    if (allYellowLetters().length > 0) {
      words = words.filter(word => allYellowLetters().every(letter => word.indexOf(letter) > -1))
    }

    allGrayLetters().forEach(letter => {
      words = words.filter(word => {
        const matches = word.match(new RegExp(letter, 'g'))
        if (!matches) {
          return true
        }

        return matches.length === Math.max(...letters.map((row, rowIndex) => row.filter((l, colIndex) => l === letter && squares[rowIndex][colIndex] !== null).length))
      })
    })

    return words
  }, [letters, squares, allWords])

  useEffect(() => {
    // noinspection JSIgnoredPromiseFromCall
    loadWords()
  }, [])

  const focusOnNextInput = (row: number, col: number) => {
    if (col < letters[row].length - 1) {
      const nextInput = document.querySelector(`#letter-${row}-${col + 1}`) as HTMLInputElement
      nextInput.focus()
      return
    }

    if (letters.length - 1 <= row) {
      return
    }

    const nextInput = document.querySelector(`#letter-${row + 1}-0`) as HTMLInputElement
    nextInput.focus()
  }

  const focusOnPreviousInput = (row: number, col: number) => {
    if (col > 0) {
      const previousInput = document.querySelector(`#letter-${row}-${col - 1}`) as HTMLInputElement
      previousInput.focus()
      return
    }
  }

  const letterInputChanged = (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    const { value } = e.currentTarget
    if (value.length === 0) {
      setLetters(current => {
        const newLetters = [...current]
        newLetters[rowIndex][colIndex] = null
        return newLetters
      })
      setSquares(current => {
        const newSquares = [...current]
        newSquares[rowIndex][colIndex] = null
        return newSquares
      })
      return
    }

    if (value.length > 1) {
      e.currentTarget.value = value[1]
    }

    if (!value.match(/[a-zA-Z]/i)) {
      e.currentTarget.value = ''
      return
    }

    setLetters(current => {
      const newLetters = [...current]
      newLetters[rowIndex][colIndex] = value[0].toLowerCase()
      return newLetters
    })

    const sameColumnSameLetter = letters.map(row => row[colIndex]).indexOf(value.toLowerCase())
    if (sameColumnSameLetter > -1 && sameColumnSameLetter !== rowIndex && squares[sameColumnSameLetter][colIndex] !== null) {
      setSquares(current => {
        const newSquares = [...current]
        newSquares[rowIndex][colIndex] = squares[sameColumnSameLetter][colIndex]
        return newSquares
      })
    }

    focusOnNextInput(rowIndex, colIndex)
  }

  const toggleSquare = (row: number, col: number) => {
    let newState: SquareState = null

    if (letters[row][col] === null) {
      setSquares(current => {
        const newSquares = [...current]
        newSquares[row][col] = null
        return newSquares
      })
    } else if (squares[row][col] === null) {
      newState = 'yellow'
      setSquares(current => {
        const newSquares = [...current]
        newSquares[row][col] = 'yellow'
        return newSquares
      })
    } else if (squares[row][col] === 'yellow') {
      newState = 'green'
      setSquares(current => {
        const newSquares = [...current]
        newSquares[row][col] = 'green'
        return newSquares
      })
    } else if (squares[row][col] === 'green') {
      setSquares(current => {
        const newSquares = [...current]
        newSquares[row][col] = null
        return newSquares
      })
    }

    const sameColumnLetters = letters.map(letterRow => letterRow[col])
    sameColumnLetters.forEach((letter, index) => {
      if (letter !== null && letter === letters[row][col]) {
        setSquares(current => {
          const newSquares = [...current]
          newSquares[index][col] = newState
          return newSquares
        })
      }
    })
  }

  const clearAll = () => {
    setLetters(() => [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ])
    setSquares(() => [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ])
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center p-8 ${inter.className}`}
    >
      <Head>
        <title>wordler 🟩 Wordle solver</title>
      </Head>
      <div className={'mb-8 text-center'}>
        <h1 className={'font-thin text-slate-600 text-center text-5xl'}>wordler</h1>
        <div className={'text-slate-400 text-sm font-light'}>by&nbsp;
          <a className={'hover:text-blue-600 transition-colors duration-200'}
             target={'_blank'}
             href={'https://github.com/Lippur'}>
            Kristo Lippur
          </a>
        </div>
      </div>
      <div className={'flex flex-col gap-1.5'}>
        {letters.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((col, colIndex) => (
              <div className={'w-16 max-w-[17%] aspect-square border-2 border-slate-300 relative letterbox'}>
                <input
                  id={`letter-${rowIndex}-${colIndex}`}
                  key={colIndex}
                  type={'text'}
                  value={letters[rowIndex][colIndex] || ''}
                  className={clsx('w-full h-full text-center font-bold text-3xl uppercase absolute top-0 left-0', {
                    'bg-slate-200': squares[rowIndex][colIndex] === null,
                    'bg-yellow-500': squares[rowIndex][colIndex] === 'yellow',
                    'bg-green-500': squares[rowIndex][colIndex] === 'green',
                    'text-slate-800': !squares[rowIndex][colIndex],
                    'text-slate-100': !!squares[rowIndex][colIndex],
                  })}
                  maxLength={2}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && e.currentTarget.value.length === 0) {
                      focusOnPreviousInput(rowIndex, colIndex)
                    }
                  }}
                  onChange={e => letterInputChanged(e, rowIndex, colIndex)}
                />
                <button
                  className={'h-4 w-4 absolute top-0 right-1 flex items-center justify-center text-slate-700 toggle'}
                  onClick={() => toggleSquare(rowIndex, colIndex)}
                >
                  <FontAwesomeIcon icon={faCircleCheck} size={'sm'}/>
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={'my-4 text-center text-slate-400'}>
        <button className={'hover:text-red-500 transition-colors duration-200 font-light'} onClick={clearAll}>
          <FontAwesomeIcon icon={faCircleXmark} size={'sm'}/> clear
        </button>
      </div>
      <div
        className={'flex gap-2 mt-8 w-full max-w-[800px] flex-wrap text-center justify-center font-light text-lg max-md:text-sm text-slate-700'}>
        {possibleWords.slice(0, 200).map((word, i) => (
          <span key={word}
                className={'px-2 py-1 bg-slate-100 rounded-md border border-slate-300'}
                style={{
                  opacity: 2 - (i / 100),
                }}>{word}</span>
        ))}
      </div>
    </main>
  )
}
