#pragma once

#include <string>
#include <vector>

class Rule final
{
public:
    std::string a;
    std::string b;
    Rule(const std::string a, const std::string b)
    {
        this->a = a;
        this->b = b;
    }
};

class LindenmayerSystem
{

public:
    std::string axiom;
    std::vector<Rule> ruleSet;
    int generation;
    LindenmayerSystem(const std::string axiom, const std::vector<Rule> ruleSet)
    {
        this->axiom = axiom;
        this->ruleSet = ruleSet;
        generation = 0;
    };
    virtual std::string generate(int iterations);
};

class DolSystem final : LindenmayerSystem
{
public:
    DolSystem(const std::string axiom, const std::vector<Rule> ruleSet) : LindenmayerSystem(axiom, ruleSet){};
    std::string generate(int iterations)
    {

        std::string sentence = this->axiom;

        /*     sentence.resize(sentence.size() + std::string("replace").size());
        sentence.append("replace");
        sentence += std::string("FF");
        return sentence; */

        while (iterations != 0)
        {
            for (int i = 0; i < sentence.size(); i++)
            {
                /*   std::string current;
                current += std::string() + sentence.at(i);
                std::string replace = current; */
                /* for (int j = 0; j < this->ruleSet.size(); j++)
                {
                    std::string a = this->ruleSet[j].a;
                    if (a == current)
                    {
                        replace = this->ruleSet[j].b;
                        break;
                    }
                } */
                sentence.resize(sentence.size() + std::string("replace").size());
                sentence += "replace";
            }
            this->generation++;
            iterations--;
        }
        return sentence;
    };
};