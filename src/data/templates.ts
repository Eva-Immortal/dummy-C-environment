import { Template } from '../types';

export const C_PLUS_PLUS_TEMPLATES: Template[] = [
  {
    id: 'hello-world',
    title: 'Hello, Modern C++',
    category: 'Basics',
    description: 'A clean introduction demonstrating standard I/O, vector collections, and modern auto type deduction.',
    files: [
      {
        name: 'main.cpp',
        content: `// Modern C++ Starter
#include <iostream>
#include <vector>
#include <string>

int main() {
    std::cout << "========================================" << std::endl;
    std::cout << " Welcome to Modern C++ Online IDE!     " << std::endl;
    std::cout << "========================================" << std::endl;

    std::vector<std::string> features = {
        "Fast Native GCC 12 Compilation",
        "Modern Standards (C++17, C++20, C++23)",
        "Standard Input (cin) Support",
        "Multi-file & Custom Headers",
        "Instant Error Diagnostics & Jump-to-Line"
    };

    std::cout << "\\nFeatures available:\\n";
    for (size_t i = 0; i < features.size(); ++i) {
        std::cout << "  [" << (i + 1) << "] " << features[i] << "\\n";
    }

    std::cout << "\\nHappy coding in C++!\\n";
    return 0;
}
`,
      },
    ],
    stdin: '',
  },
  {
    id: 'stl-algorithms',
    title: 'STL Containers & Algorithms',
    category: 'Algorithms',
    description: 'Demonstrating vector, map, priority_queue, lambda functions, and std::accumulate.',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <unordered_map>
#include <queue>

int main() {
    std::vector<int> numbers = {42, 17, 89, 5, 23, 68, 12};

    std::cout << "Original array: ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << "\\n";

    // Sort in descending order using modern lambda
    std::sort(numbers.begin(), numbers.end(), [](int a, int b) {
        return a > b;
    });

    std::cout << "Sorted (descending): ";
    for (int n : numbers) std::cout << n << " ";
    std::cout << "\\n";

    // Calculate sum using std::accumulate
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    double avg = static_cast<double>(sum) / numbers.size();
    std::cout << "Sum: " << sum << " | Average: " << avg << "\\n\\n";

    // Hash map for frequency counting
    std::unordered_map<std::string, int> inventory = {
        {"laptop", 12}, {"mouse", 45}, {"keyboard", 28}
    };
    std::cout << "Inventory tracking:\\n";
    for (const auto& [item, count] : inventory) {
        std::cout << "  - " << item << ": " << count << " units\\n";
    }

    // Min-heap priority queue
    std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;
    for (int n : numbers) minHeap.push(n);

    std::cout << "\\nPriority Queue (popping lowest elements first): ";
    while (!minHeap.empty()) {
        std::cout << minHeap.top() << " ";
        minHeap.pop();
    }
    std::cout << "\\n";

    return 0;
}
`,
      },
    ],
    stdin: '',
  },
  {
    id: 'cpp20-ranges',
    title: 'C++20 Ranges & Views',
    category: 'Modern C++',
    description: 'Clean composable pipeline transformations with std::views::filter and transform.',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <vector>
#include <ranges>

int main() {
    std::cout << "--- C++20 Ranges Pipeline Demo ---\\n\\n";

    std::vector<int> data = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};

    // Filter even numbers, square them, and take the first 4
    auto pipeline = data 
        | std::views::filter([](int n) { return n % 2 == 0; })
        | std::views::transform([](int n) { return n * n; })
        | std::views::take(4);

    std::cout << "Even squares (first 4 items):\\n";
    for (int val : pipeline) {
        std::cout << " -> " << val << "\\n";
    }

    return 0;
}
`,
      },
    ],
    stdin: '',
  },
  {
    id: 'competitive-programming',
    title: 'Competitive Programming Template',
    category: 'Problem Solving',
    description: 'Optimized fast I/O setup with test case loops and interactive standard input.',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

// Fast I/O optimization
void fast_io() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);
}

void solve(int testCase) {
    int n;
    if (!(std::cin >> n)) return;

    std::vector<long long> a(n);
    long long maxVal = -1e18;
    long long sum = 0;

    for (int i = 0; i < n; ++i) {
        std::cin >> a[i];
        sum += a[i];
        maxVal = std::max(maxVal, a[i]);
    }

    std::cout << "Case #" << testCase << ": count=" << n 
              << ", sum=" << sum << ", max=" << maxVal << "\\n";
}

int main() {
    fast_io();

    int t = 1;
    if (std::cin >> t) {
        std::cout << "Running " << t << " test cases from stdin:\\n";
        for (int i = 1; i <= t; ++i) {
            solve(i);
        }
    } else {
        std::cout << "No input detected in Standard Input (stdin) tab.\\n";
        std::cout << "Switch to the 'Standard Input' tab and enter test values!\\n";
    }

    return 0;
}
`,
      },
    ],
    stdin: `3
5
10 20 35 40 50
4
100 -20 500 45
3
7 7 7`,
  },
  {
    id: 'oop-polymorphism',
    title: 'Object-Oriented & Polymorphism',
    category: 'OOP',
    description: 'Demonstrating abstract base classes, virtual dispatch, inheritance, and smart pointers.',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <vector>
#include <memory>
#include <string>

// Abstract Base Class
class Shape {
protected:
    std::string name;
public:
    Shape(std::string name) : name(std::move(name)) {}
    virtual ~Shape() = default; // Essential virtual destructor

    virtual double area() const = 0; // Pure virtual
    virtual void describe() const {
        std::cout << "Shape: " << name << ", Area: " << area() << "\\n";
    }
};

// Derived: Circle
class Circle : public Shape {
private:
    double radius;
public:
    Circle(double r) : Shape("Circle"), radius(r) {}
    double area() const override {
        return 3.141592653589793 * radius * radius;
    }
};

// Derived: Rectangle
class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h) : Shape("Rectangle"), width(w), height(h) {}
    double area() const override {
        return width * height;
    }
};

int main() {
    std::cout << "--- Polymorphism with std::unique_ptr ---\\n";

    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes.push_back(std::make_unique<Rectangle>(4.0, 6.0));
    shapes.push_back(std::make_unique<Circle>(2.5));

    double totalArea = 0.0;
    for (const auto& s : shapes) {
        s->describe();
        totalArea += s->area();
    }

    std::cout << "\\nTotal combined area: " << totalArea << "\\n";
    return 0;
}
`,
      },
    ],
    stdin: '',
  },
  {
    id: 'smart-pointers-raii',
    title: 'Smart Pointers & RAII',
    category: 'Memory',
    description: 'Safe memory management without memory leaks using std::unique_ptr and std::shared_ptr.',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include <memory>
#include <string>

class Resource {
public:
    std::string name;
    Resource(std::string n) : name(std::move(n)) {
        std::cout << "[Resource Acquired] " << name << "\\n";
    }
    ~Resource() {
        std::cout << "[Resource Released (Destructor)] " << name << "\\n";
    }
    void use() const {
        std::cout << "Using resource: " << name << "\\n";
    }
};

void demoUniquePtr() {
    std::cout << "\\n1. Demo: std::unique_ptr (Exclusive Ownership)\\n";
    {
        auto res1 = std::make_unique<Resource>("DatabaseConnection");
        res1->use();
        std::cout << "Leaving unique_ptr scope...\\n";
    } // res1 automatically deleted here
    std::cout << "Scope left.\\n";
}

void demoSharedPtr() {
    std::cout << "\\n2. Demo: std::shared_ptr (Shared Ownership)\\n";
    std::shared_ptr<Resource> outer;
    {
        auto inner = std::make_shared<Resource>("SharedCache");
        outer = inner;
        std::cout << "Inside inner scope: reference count = " << outer.use_count() << "\\n";
    }
    std::cout << "Outside inner scope: reference count = " << outer.use_count() << "\\n";
    outer->use();
    std::cout << "Leaving outer scope...\\n";
}

int main() {
    std::cout << "========================================\\n";
    std::cout << " C++ RAII & Modern Smart Pointers Demo \\n";
    std::cout << "========================================\\n";

    demoUniquePtr();
    demoSharedPtr();

    std::cout << "\\nAll resources freed cleanly with zero leaks!\\n";
    return 0;
}
`,
      },
    ],
    stdin: '',
  },
  {
    id: 'multi-file-headers',
    title: 'Multi-File & Header (.h)',
    category: 'Project Structure',
    description: 'Demonstrating how to structure C++ projects with header files and modular source code.',
    files: [
      {
        name: 'main.cpp',
        content: `#include <iostream>
#include "calculator.h"

int main() {
    std::cout << "--- Multi-File C++ Project Demo ---\\n\\n";

    double a = 15.5;
    double b = 4.5;

    std::cout << "Values: a = " << a << ", b = " << b << "\\n";
    std::cout << "Add:      " << Calculator::add(a, b) << "\\n";
    std::cout << "Subtract: " << Calculator::subtract(a, b) << "\\n";
    std::cout << "Multiply: " << Calculator::multiply(a, b) << "\\n";
    std::cout << "Divide:   " << Calculator::divide(a, b) << "\\n";
    std::cout << "Power:    " << Calculator::power(2, 8) << "\\n";

    return 0;
}
`,
      },
      {
        name: 'calculator.h',
        content: `#pragma once
#include <cmath>
#include <stdexcept>

class Calculator {
public:
    static double add(double a, double b) {
        return a + b;
    }

    static double subtract(double a, double b) {
        return a - b;
    }

    static double multiply(double a, double b) {
        return a * b;
    }

    static double divide(double a, double b) {
        if (b == 0.0) {
            throw std::runtime_error("Division by zero!");
        }
        return a / b;
    }

    static double power(double base, double exp) {
        return std::pow(base, exp);
    }
};
`,
      },
    ],
    stdin: '',
  },
];
