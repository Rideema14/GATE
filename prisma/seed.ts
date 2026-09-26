import { PrismaClient } from '@prisma/client';
const p=new PrismaClient();
const data=[
['General Aptitude','GA',['Verbal aptitude','Quantitative aptitude','Analytical aptitude']],
['Probability & Statistics','PS',['Probability basics','Conditional probability and Bayes theorem','Random variables and distributions','Expectation and moments','Descriptive statistics','Inference and hypothesis testing']],
['Linear Algebra','LA',['Vectors and matrices','Systems of linear equations','Linear transformations','Eigenvalues and eigenvectors','Orthogonality and projections']],
['Calculus & Optimization','CO',['Limits and continuity','Differentiation','Partial derivatives','Maxima and minima','Optimization basics']],
['Programming & Data Structures','PD',['Python basics','Functions and recursion','Arrays, stacks and queues','Trees and heaps','Graphs','Complexity, sorting and searching']],
['Database Management & Warehousing','DB',['ER and relational models','SQL','Keys and functional dependencies','Normalization','Transactions and indexing','OLAP and data warehousing']],
['Machine Learning','ML',['Regression','Classification','Model evaluation','Regularization','Clustering','Dimensionality reduction','Neural network basics']],
['Artificial Intelligence','AI',['Search','Game playing and minimax','Logic and knowledge representation','Uncertainty','Probabilistic inference','AI fundamentals']]
];
async function main(){for(const [name,code,topics] of data){const s=await p.subject.upsert({where:{code:String(code)},update:{name:String(name)},create:{name:String(name),code:String(code)}});for(let i=0;i<(topics as string[]).length;i++)await p.topic.upsert({where:{id:`${code}-${i}`},update:{name:(topics as string[])[i],order:i,subjectId:s.id},create:{id:`${code}-${i}`,name:(topics as string[])[i],order:i,subjectId:s.id}})}}main().finally(()=>p.$disconnect());
