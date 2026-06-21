const questions = [
  {
    "id": 1,
    "title": "Separate Odd and Even Numbers",
    "category": "Collectors",
    "difficulty": "Easy",
    "input": "List<Integer> listOfIntegers = Arrays.asList(71, 18, 42, 21, 67, 32, 95, 14, 56, 87);",
    "solution": "listOfIntegers.stream()\n    .collect(Collectors.partitioningBy(i -> i % 2 == 0));",
    "expectedOutput": "{false=[71, 21, 67, 95, 87], true=[18, 42, 32, 14, 56]}"
  },
  {
    "id": 2,
    "title": "Remove Duplicate Elements From List",
    "category": "Streams",
    "difficulty": "Easy",
    "input": "List<String> listOfStrings = Arrays.asList(\"Java\", \"Python\", \"C#\", \"Java\", \"Kotlin\", \"Python\");",
    "solution": "listOfStrings.stream().distinct().collect(Collectors.toList());",
    "expectedOutput": "[Java, Python, C#, Kotlin]"
  },
  {
    "id": 3,
    "title": "Frequency of Each Character in String",
    "category": "Strings",
    "difficulty": "Medium",
    "input": "String inputString = \"Java Concept Of The Day\";",
    "solution": "inputString.chars()\n    .mapToObj(c -> (char) c)\n    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));",
    "expectedOutput": "{ =4, a=2, C=1, d=1, D=1, e=1, f=1, h=1, y=1, J=1, n=1, o=1, p=1, t=1, T=1, v=1}"
  },
  {
    "id": 4,
    "title": "Frequency of Each Element in an Array",
    "category": "Arrays",
    "difficulty": "Medium",
    "input": "List<String> anyList = Arrays.asList(\"Pen\", \"Eraser\", \"Note Book\", \"Pen\", \"Pencil\", \"Pen\", \"Eraser\");",
    "solution": "anyList.stream().collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));",
    "expectedOutput": "{Pen=3, Eraser=2, Note Book=1, Pencil=1}"
  },
  {
    "id": 5,
    "title": "Sort the List in Reverse Order",
    "category": "Sorting",
    "difficulty": "Easy",
    "input": "List<String> anyList = Arrays.asList(\"Java\", \"Python\", \"C#\", \"Kotlin\", \"C++\");",
    "solution": "anyList.stream().sorted(Comparator.reverseOrder()).forEach(System.out::println);",
    "expectedOutput": "Python\nKotlin\nJava\nC#\nC++"
  },
  {
    "id": 6,
    "title": "Join List of Strings with Prefix, Suffix and Delimiter",
    "category": "Collectors",
    "difficulty": "Easy",
    "input": "List<String> listOfStrings = Arrays.asList(\"Facebook\", \"Twitter\", \"Instagram\", \"YouTube\");",
    "solution": "listOfStrings.stream().collect(Collectors.joining(\"Delimiter\", \"Prefix\", \"Suffix\"));",
    "expectedOutput": "PrefixFacebookDelimiterTwitterDelimiterInstagramDelimiterYouTubeSuffix"
  },
  {
    "id": 7,
    "title": "Print Multiples of 5 From the List",
    "category": "Numbers",
    "difficulty": "Easy",
    "input": "List<Integer> listOfIntegers = Arrays.asList(45, 12, 56, 15, 24, 75, 31, 80);",
    "solution": "listOfIntegers.stream()\n    .filter(i -> i % 5 == 0).forEach(System.out::println);",
    "expectedOutput": "45\n15\n75\n80"
  },
  {
    "id": 8,
    "title": "Maximum & Minimum in a List",
    "category": "Streams",
    "difficulty": "Easy",
    "input": "List<Integer> listOfIntegers = Arrays.asList(45, 12, 56, 15, 24, 75, 31, 80);",
    "solution": "// Maximum\nlistOfIntegers.stream().max(Comparator.naturalOrder()).get();\n\n// Minimum\nlistOfIntegers.stream().min(Comparator.naturalOrder()).get();",
    "expectedOutput": "Maximum Element : 80\nMinimum Element : 12"
  },
  {
    "id": 9,
    "title": "Merge Two Unsorted Arrays Into Single Sorted Array",
    "category": "Arrays",
    "difficulty": "Medium",
    "input": "int[] a = new int[] {4, 2, 7, 1};\nint[] b = new int[] {8, 3, 9, 5};",
    "solution": "IntStream.concat(Arrays.stream(a), Arrays.stream(b))\n    .sorted().toArray();",
    "expectedOutput": "[1, 2, 3, 4, 5, 7, 8, 9]"
  },
  {
    "id": 10,
    "title": "Anagram Program in Java 8",
    "category": "Strings",
    "difficulty": "Medium",
    "input": "String s1 = \"RaceCar\";\nString s2 = \"CarRace\";",
    "solution": "s1 = Stream.of(s1.split(\"\")).map(String::toUpperCase).sorted().collect(Collectors.joining());\n\ns2 = Stream.of(s2.split(\"\")).map(String::toUpperCase).sorted().collect(Collectors.joining());\n\nif (s1.equals(s2)) {\n    System.out.println(\"Both strings are anagrams\");\n}",
    "expectedOutput": "Both strings are anagrams"
  },
  {
    "id": 11,
    "title": "Merge Two Unsorted Arrays Into Single Sorted Array Without Duplicates",
    "category": "Arrays",
    "difficulty": "Medium",
    "input": "int[] a = new int[] {4, 2, 5, 1};\nint[] b = new int[] {8, 1, 9, 5};",
    "solution": "IntStream.concat(Arrays.stream(a), Arrays.stream(b))\n    .sorted().distinct().toArray();",
    "expectedOutput": "[1, 2, 4, 5, 8, 9]"
  },
  {
    "id": 12,
    "title": "Sum of All Digits of a Number",
    "category": "Numbers",
    "difficulty": "Medium",
    "input": "int inputNumber = 15643;",
    "solution": "Stream.of(String.valueOf(inputNumber).split(\"\"))\n    .collect(Collectors.summingInt(Integer::parseInt));",
    "expectedOutput": "19"
  },
  {
    "id": 13,
    "title": "Three Max & Min Numbers From the List",
    "category": "Numbers",
    "difficulty": "Medium",
    "input": "List<Integer> listOfIntegers = Arrays.asList(45, 12, 56, 15, 24, 75, 31, 80);",
    "solution": "// Min 3 Numbers\nlistOfIntegers.stream().sorted().limit(3).forEach(System.out::println);\n\n// Max 3 Numbers\nlistOfIntegers.stream().sorted(Comparator.reverseOrder()).limit(3).forEach(System.out::println);",
    "expectedOutput": "Min 3:\n12\n15\n24\n\nMax 3:\n80\n75\n56"
  },
  {
    "id": 14,
    "title": "Second Largest Number in an Integer Array",
    "category": "Arrays",
    "difficulty": "Medium",
    "input": "List<Integer> listOfIntegers = Arrays.asList(45, 12, 56, 15, 24, 75, 31, 80);",
    "solution": "listOfIntegers.stream().sorted(Comparator.reverseOrder()).skip(1).findFirst().get();",
    "expectedOutput": "75"
  },
  {
    "id": 15,
    "title": "Sort List of Strings in Increasing Order of Their Length",
    "category": "Sorting",
    "difficulty": "Easy",
    "input": "List<String> listOfStrings = Arrays.asList(\"Java\", \"Python\", \"C#\", \"HTML\", \"Kotlin\", \"C++\");",
    "solution": "listOfStrings.stream().sorted(Comparator.comparing(String::length)).forEach(System.out::println);",
    "expectedOutput": "C#\nC++\nJava\nHTML\nPython\nKotlin"
  },
  {
    "id": 16,
    "title": "Common Elements Between Two Arrays",
    "category": "Arrays",
    "difficulty": "Easy",
    "input": "List<Integer> list1 = Arrays.asList(1, 2, 3, 4, 5);\nList<Integer> list2 = Arrays.asList(4, 5, 6, 7, 8);",
    "solution": "list1.stream().filter(list2::contains).forEach(System.out::println);",
    "expectedOutput": "4\n5"
  },
  {
    "id": 17,
    "title": "Sum & Average of All Elements of an Array",
    "category": "Arrays",
    "difficulty": "Easy",
    "input": "int[] inputArray = new int[] {4, 5, 1, 2, 8, 3};",
    "solution": "// Sum\nArrays.stream(inputArray).sum();\n\n// Average\nArrays.stream(inputArray).average().getAsDouble();",
    "expectedOutput": "Sum : 23\nAverage : 3.8333333333333335"
  },
  {
    "id": 18,
    "title": "Reverse Each Word of a String",
    "category": "Strings",
    "difficulty": "Medium",
    "input": "String str = \"Java Concept Of The Day\";",
    "solution": "Arrays.stream(str.split(\" \"))\n    .map(word -> new StringBuffer(word).reverse())\n    .collect(Collectors.joining(\" \"));",
    "expectedOutput": "avaJ tpecnoC fO ehT yaD"
  },
  {
    "id": 19,
    "title": "Reverse An Integer Array",
    "category": "Arrays",
    "difficulty": "Medium",
    "input": "int[] array = new int[] {5, 1, 7, 3, 9, 6};",
    "solution": "IntStream.rangeClosed(1, array.length)\n    .map(i -> array[array.length - i])\n    .toArray();",
    "expectedOutput": "[6, 9, 3, 7, 1, 5]"
  },
  {
    "id": 20,
    "title": "Sum of First 10 Natural Numbers",
    "category": "Numbers",
    "difficulty": "Easy",
    "input": "// No setup needed. Starts with IntStream.range()",
    "solution": "IntStream.range(1, 11).sum();",
    "expectedOutput": "55"
  },
  {
    "id": 21,
    "title": "Palindrome Program in Java 8",
    "category": "Strings",
    "difficulty": "Medium",
    "input": "String str = \"ROTATOR\";",
    "solution": "IntStream.range(0, str.length()/2)\n    .noneMatch(i -> str.charAt(i) != str.charAt(str.length() - i - 1));",
    "expectedOutput": "true"
  },
  {
    "id": 22,
    "title": "Find Strings Which Start With Number",
    "category": "Strings",
    "difficulty": "Easy",
    "input": "List<String> listOfStrings = Arrays.asList(\"One\", \"2Two\", \"Three\", \"4Four\", \"Five\");",
    "solution": "listOfStrings.stream()\n    .filter(str -> Character.isDigit(str.charAt(0)))\n    .forEach(System.out::println);",
    "expectedOutput": "2Two\n4Four"
  },
  {
    "id": 23,
    "title": "Last Element of an Array",
    "category": "Streams",
    "difficulty": "Easy",
    "input": "List<String> listOfStrings = Arrays.asList(\"One\", \"Two\", \"Three\", \"Four\", \"Five\");",
    "solution": "listOfStrings.stream().skip(listOfStrings.size()-1).findFirst().get();",
    "expectedOutput": "Five"
  },
  {
    "id": 24,
    "title": "Find Duplicate Elements From an Array",
    "category": "Arrays",
    "difficulty": "Medium",
    "input": "List<Integer> listOfIntegers = Arrays.asList(111, 222, 333, 111, 555, 222);\nSet<Integer> set = new HashSet<>();",
    "solution": "listOfIntegers.stream()\n    .filter(i -> !set.add(i))\n    .collect(Collectors.toSet());",
    "expectedOutput": "[111, 222]"
  },
  {
    "id": 25,
    "title": "Age of Person in Years",
    "category": "Miscellaneous",
    "difficulty": "Easy",
    "input": "// Variables defined in code solution body.",
    "solution": "LocalDate birthDay = LocalDate.of(1985, 01, 23);\nLocalDate today = LocalDate.now();\nSystem.out.println(ChronoUnit.YEARS.between(birthDay, today));",
    "expectedOutput": "41"
  },
  {
    "id": 26,
    "title": "Fibonacci Series",
    "category": "Numbers",
    "difficulty": "Medium",
    "input": "// Seed arrays generated in stream iterate.",
    "solution": "Stream.iterate(new int[] {0, 1}, f -> new int[] {f[1], f[0]+f[1]})\n    .limit(10)\n    .map(f -> f[0])\n    .forEach(i -> System.out.print(i+\" \"));",
    "expectedOutput": "0 1 1 2 3 5 8 13 21 34 "
  }
];
