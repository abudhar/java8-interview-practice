const questions = [
  {
    id: 1,
    title: "Separate Odd and Even Numbers",
    category: "Collectors",
    difficulty: "Easy",
    solution: `listOfIntegers.stream()
    .collect(Collectors.partitioningBy(i -> i % 2 == 0));`
  },
  {
    id: 2,
    title: "Remove Duplicate Elements From List",
    category: "Streams",
    difficulty: "Easy",
    solution: `listOfStrings.stream().distinct().collect(Collectors.toList());`
  },
  {
    id: 3,
    title: "Frequency of Each Character in String",
    category: "Strings",
    difficulty: "Medium",
    solution: `inputString.chars()
    .mapToObj(c -> (char) c)
    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));`
  },
  {
    id: 4,
    title: "Frequency of Each Element in an Array",
    category: "Arrays",
    difficulty: "Medium",
    solution: `anyList.stream().collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));`
  },
  {
    id: 5,
    title: "Sort the List in Reverse Order",
    category: "Sorting",
    difficulty: "Easy",
    solution: `anyList.stream().sorted(Comparator.reverseOrder()).forEach(System.out::println);`
  },
  {
    id: 6,
    title: "Join List of Strings with Prefix, Suffix and Delimiter",
    category: "Collectors",
    difficulty: "Easy",
    solution: `listOfStrings.stream().collect(Collectors.joining("Delimiter", "Prefix", "Suffix"));`
  },
  {
    id: 7,
    title: "Print Multiples of 5 From the List",
    category: "Numbers",
    difficulty: "Easy",
    solution: `listOfIntegers.stream()
    .filter(i -> i % 5 == 0).forEach(System.out::println);`
  },
  {
    id: 8,
    title: "Maximum & Minimum in a List",
    category: "Streams",
    difficulty: "Easy",
    solution: `// Maximum
listOfIntegers.stream().max(Comparator.naturalOrder()).get();

// Minimum
listOfIntegers.stream().min(Comparator.naturalOrder()).get();`
  },
  {
    id: 9,
    title: "Merge Two Unsorted Arrays Into Single Sorted Array",
    category: "Arrays",
    difficulty: "Medium",
    solution: `IntStream.concat(Arrays.stream(a), Arrays.stream(b))
    .sorted().toArray();`
  },
  {
    id: 10,
    title: "Anagram Program in Java 8",
    category: "Strings",
    difficulty: "Medium",
    solution: `s1 = Stream.of(s1.split("")).map(String::toUpperCase).sorted().collect(Collectors.joining());

s2 = Stream.of(s2.split("")).map(String::toUpperCase).sorted().collect(Collectors.joining());

if (s1.equals(s2)) {
    System.out.println("Both strings are anagrams");
}`
  },
  {
    id: 11,
    title: "Merge Two Unsorted Arrays Into Single Sorted Array Without Duplicates",
    category: "Arrays",
    difficulty: "Medium",
    solution: `IntStream.concat(Arrays.stream(a), Arrays.stream(b))
    .sorted().distinct().toArray();`
  },
  {
    id: 12,
    title: "Sum of All Digits of a Number",
    category: "Numbers",
    difficulty: "Medium",
    solution: `Stream.of(String.valueOf(inputNumber).split(""))
    .collect(Collectors.summingInt(Integer::parseInt));`
  },
  {
    id: 13,
    title: "Three Max & Min Numbers From the List",
    category: "Numbers",
    difficulty: "Medium",
    solution: `// Min 3 Numbers
listOfIntegers.stream().sorted().limit(3).forEach(System.out::println);

// Max 3 Numbers
listOfIntegers.stream().sorted(Comparator.reverseOrder()).limit(3).forEach(System.out::println);`
  },
  {
    id: 14,
    title: "Second Largest Number in an Integer Array",
    category: "Arrays",
    difficulty: "Medium",
    solution: `listOfIntegers.stream().sorted(Comparator.reverseOrder()).skip(1).findFirst().get();`
  },
  {
    id: 15,
    title: "Sort List of Strings in Increasing Order of Their Length",
    category: "Sorting",
    difficulty: "Easy",
    solution: `listOfStrings.stream().sorted(Comparator.comparing(String::length)).forEach(System.out::println);`
  },
  {
    id: 16,
    title: "Common Elements Between Two Arrays",
    category: "Arrays",
    difficulty: "Easy",
    solution: `list1.stream().filter(list2::contains).forEach(System.out::println);`
  },
  {
    id: 17,
    title: "Sum & Average of All Elements of an Array",
    category: "Arrays",
    difficulty: "Easy",
    solution: `// Sum
Arrays.stream(inputArray).sum();

// Average
Arrays.stream(inputArray).average().getAsDouble();`
  },
  {
    id: 18,
    title: "Reverse Each Word of a String",
    category: "Strings",
    difficulty: "Medium",
    solution: `Arrays.stream(str.split(" "))
    .map(word -> new StringBuffer(word).reverse())
    .collect(Collectors.joining(" "));`
  },
  {
    id: 19,
    title: "Reverse An Integer Array",
    category: "Arrays",
    difficulty: "Medium",
    solution: `IntStream.rangeClosed(1, array.length)
    .map(i -> array[array.length - i])
    .toArray();`
  },
  {
    id: 20,
    title: "Sum of First 10 Natural Numbers",
    category: "Numbers",
    difficulty: "Easy",
    solution: `IntStream.range(1, 11).sum();`
  },
  {
    id: 21,
    title: "Palindrome Program in Java 8",
    category: "Strings",
    difficulty: "Medium",
    solution: `IntStream.range(0, str.length()/2)
    .noneMatch(i -> str.charAt(i) != str.charAt(str.length() - i - 1));`
  },
  {
    id: 22,
    title: "Find Strings Which Start With Number",
    category: "Strings",
    difficulty: "Easy",
    solution: `listOfStrings.stream()
    .filter(str -> Character.isDigit(str.charAt(0)))
    .forEach(System.out::println);`
  },
  {
    id: 23,
    title: "Last Element of an Array",
    category: "Streams",
    difficulty: "Easy",
    solution: `listOfStrings.stream().skip(listOfStrings.size()-1).findFirst().get();`
  },
  {
    id: 24,
    title: "Find Duplicate Elements From an Array",
    category: "Arrays",
    difficulty: "Medium",
    solution: `listOfIntegers.stream()
    .filter(i -> !set.add(i))
    .collect(Collectors.toSet());`
  },
  {
    id: 25,
    title: "Age of Person in Years",
    category: "Miscellaneous",
    difficulty: "Easy",
    solution: `LocalDate birthDay = LocalDate.of(1985, 01, 23);
LocalDate today = LocalDate.now();
System.out.println(ChronoUnit.YEARS.between(birthDay, today));`
  },
  {
    id: 26,
    title: "Fibonacci Series",
    category: "Numbers",
    difficulty: "Medium",
    solution: `Stream.iterate(new int[] {0, 1}, f -> new int[] {f[1], f[0]+f[1]})
    .limit(10)
    .map(f -> f[0])
    .forEach(i -> System.out.print(i+" "));`
  }
];
