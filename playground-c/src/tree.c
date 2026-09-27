#include <stdio.h>
#include <stdlib.h>

// NOTE: "tree" here means "binary search tree"x ("BST")

// define the framework for the node
typedef struct TreeNode TreeNode;
struct TreeNode
{
  int value;
  TreeNode *left;
  TreeNode *right;
};

// create a node
TreeNode *createTreeNode(int value)
{
  TreeNode *node = (TreeNode*)malloc(sizeof(TreeNode));
  node->value = value;
  node->left = NULL;
  node->right = NULL;
  return node;
}

// print the tree (preorder, inorder, postorder: just move the print statement around)
void printTree(TreeNode *tree)
{
  if(tree == NULL)
	return;

  if(tree->left != NULL);
    printTree(tree->left);

  printf("%i ", tree->value);

  if(tree->right != NULL)
    printTree(tree->right);
}

// binary search (recursive)
void findNodeWithValueR(TreeNode *tree, int value)
{
  if(tree == NULL)
  {
    printf("%d: not found\n", value);
    return;
  }
  if(tree->value == value)
  {
    printf("%d: found\n", value);
	return;
  }
  if(tree->value >= value)
    findNodeWithValueR(tree->left, value);
  else
    findNodeWithValueR(tree->right, value);
} 

// binary search (iterative)
void findNodeWithValueI(TreeNode *node, int value)
{
  while(node != NULL)
  {
    if(node->value == value)
	{
      printf("%d: found\n", value);
	  return;
	}
	if(node->value >= value)
	  node = node->left;
	else
	  node = node->right;
  }
  printf("%d: not found\n", value);
}

// find the common ancestor of two values (recursive)
// NOTE: the values *must* exist in the tree (otherwise: undefined behavior)
void findCommonAncestorR(TreeNode *node, int val1, int val2)
{
  if(val1 > node->value && val2 > node->value)
    findCommonAncestorR(node->right, val1, val2);
  else if(val1 < node->value && val2 < node->value)
    findCommonAncestorR(node->left, val1, val2);
  else
    printf("Common ancestor for %d and %d is %d.\n", val1, val2, node->value);
}

// find the common ancestor of two values (iterative)
//  NOTE: the values *must* exist in the tree (otherwise: undefined behavior)
void findCommonAncestorI(TreeNode *node, int val1, int val2)
{
  for(;;)
  {
	if(val1 > node->value && val2 > node->value)
	  node = node->right;
	else if(val1 < node->value && val2 < node->value)
	  node = node->left;
	else
	{
	  printf("Common ancestor for %d and %d is %d.\n", val1, val2, node->value);
	  break;
	}
  }
}

// insert value into tree
TreeNode* insertValue(TreeNode *tree, int value)
{
  TreeNode *node = createTreeNode(value);
  
  if(tree == NULL)
    return node;
	
  if(value < tree->value)
    tree->left = insertValue(tree->left, value);
  else if(value > tree->value)
    tree->right = insertValue(tree->right, value);
  else
    printf("ERROR: duplicate for %d found; ignoring.\n", value);
  return tree;
} 

int depth(TreeNode *tree) {
  if (tree == NULL) {
    return 0;
  }
  int depthL = depth(tree->left);
  int depthR = depth(tree->right);
  if (depthL > depthR) {
    return depthL + 1;
  } else {
    return depthR + 1;
  }
}

// test everything
int main(char** args)
{
  TreeNode *tree = createTreeNode(5);
  tree->left = createTreeNode(3);
  tree->right = createTreeNode(10);
  tree->left->left = createTreeNode(1);
  tree->left->right = createTreeNode(4);
  tree->right->left = createTreeNode(7);
  tree->right->right = createTreeNode(12);
  
  printf("\n");
  printTree(tree);
  printf("\n\n");

  findNodeWithValueR(tree, 12);
  findNodeWithValueI(tree, 12);
  
  findCommonAncestorR(tree, 4, 12);
  findCommonAncestorI(tree, 7, 12);
 
  printf("\nDepth: %d", depth(tree));
 
  tree = insertValue(tree, 2);
  printf("\nA value 2 inserted\n");
  printTree(tree);
  printf("\nDepth: %d\n\n", depth(tree));
   
  return 0;
}
