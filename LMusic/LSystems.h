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
        char sentence[9999];

        for (int k = 0; k < sizeof(sentence); k++)
        {
            sentence[k] = this->axiom[k];
        }

        //sentence[1] = 'A';

        //return std::string(sentence);

        /* sentence.resize(sentence.size() + std::string("replace").size());
        sentence.append("replace");
        sentence += std::string("FF"); */
        /* char init[] = "this is init";
        char add[] = " added now";
        return std::strcat(init, add); */

        while (iterations != 0)
        {
            for (int i = 0; i < 9999; i++)
            {
                char current[9999];
                for (int o = 0; i < sizeof(sentence); i++)
                {
                    current[o] = sentence[o];
                }
                //current += std::string() + sentence[i];
                char replace[9999];
                for (int a = 0; a < sizeof(current); a++)
                {
                    replace[a] = current[a];
                }
                for (int j = 0; j < this->ruleSet.size(); j++)
                {
                    std::string a = this->ruleSet[j].a;
                    if (a == current)
                    {
                        //replace = this->ruleSet[j].b;
                        for (int t = 0; t < sizeof(this->ruleSet[j].b); t++)
                        {
                            replace[t] = this->ruleSet[j].b[t];
                        }
                        break;
                    }
                }
                for (int m = 0; m < sizeof(replace); m++)
                {
                    sentence[m] = replace[m];
                }
            }
            this->generation++;
            iterations--;
        }
        return std::string(sentence);
    };
};
